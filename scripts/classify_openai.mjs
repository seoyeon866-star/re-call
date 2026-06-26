import { readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const API_KEY = env.OPENAI_API_KEY

const CATEGORIES = ['유아동', '화장품', '생활용품', '완구류', '의류', '욕실용품', '식품류', '주방용품', '반려동물', '전자제품']
const BATCH_SIZE = 10
const CHECKPOINT_FILE = 'scripts/classify_checkpoint.json'

function buildPrompt(items) {
  return `다음 제품들을 가장 적합한 카테고리로 분류해주세요.
카테고리: ${CATEGORIES.join(', ')}

각 항목의 형식: ID|제품명|제조사|설명

${items.map(i => `${i.id}|${i.product_nm}|${i.makr}|${i.shrtcom_cn}`).join('\n')}

각 ID와 카테고리를 "ID: 카테고리" 형식으로 한 줄씩만 출력하세요.
예:
123: 전자제품
456: 완구류`
}

async function classifyBatch(items) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt(items) }],
      temperature: 0.1,
      max_tokens: 2048
    })
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`OpenAI ${resp.status}: ${err}`)
  }
  const json = await resp.json()
  const text = json.choices[0].message.content
  const result = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^(\d+):\s*(.+)$/)
    if (m) result[m[1]] = m[2].trim()
  }
  return result
}

// Load checkpoint
let processed = new Set()
try {
  const cp = JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf8'))
  processed = new Set(cp.processed || [])
  console.log(`Resumed from checkpoint: ${processed.size} done`)
} catch {}

let offset = 0
let done = 0
let updated = 0

while (true) {
  const { data: batch, error } = await sb.from('recalls')
    .select('recall_sn, product_nm, makr, shrtcom_cn')
    .eq('category', '기타')
    .not('recall_img_urls', 'is', null)
    .neq('recall_img_urls', '')
    .range(offset, offset + BATCH_SIZE * 5 - 1) // fetch more to skip processed

  if (error) { console.error('DB error:', error.message); break }
  if (!batch || batch.length === 0) break

  // Filter out already processed, take BATCH_SIZE
  const unprocessed = batch.filter(r => !processed.has(r.recall_sn)).slice(0, BATCH_SIZE)
  if (unprocessed.length === 0) { offset += batch.length; continue }

  const toClassify = unprocessed.map(r => ({
    id: r.recall_sn.replace('RCLL_', ''),
    recall_sn: r.recall_sn,
    product_nm: r.product_nm || '',
    makr: r.makr || '',
    shrtcom_cn: (r.shrtcom_cn || '').slice(0, 200)
  }))

  try {
    const classifications = await classifyBatch(toClassify)
    const updates = []
    for (const item of toClassify) {
      const cat = classifications[item.id]
      if (cat && CATEGORIES.includes(cat)) {
        updates.push(item.recall_sn, cat)
      }
      processed.add(item.recall_sn)
    }
    // Batch update
    for (let i = 0; i < updates.length; i += 2) {
      const { error: uErr } = await sb.from('recalls')
        .update({ category: updates[i + 1] })
        .eq('recall_sn', updates[i])
      if (uErr) console.error('Update error:', updates[i], uErr.message)
      else updated++
    }
    done += toClassify.length
    console.log(`done: ${done} | updated: ${updated} (this batch: ${updates.length / 2})`)
  } catch (e) {
    console.error('Batch error:', e.message)
    // Save checkpoint before exit
    writeFileSync(CHECKPOINT_FILE, JSON.stringify({ processed: [...processed] }))
    process.exit(1)
  }

  // Save checkpoint every 10 batches
  if (done % (BATCH_SIZE * 10) === 0) {
    writeFileSync(CHECKPOINT_FILE, JSON.stringify({ processed: [...processed] }))
  }

  offset += batch.length
}

writeFileSync(CHECKPOINT_FILE, JSON.stringify({ processed: [...processed] }))
console.log(`\n✓ Complete! Processed: ${done}, Updated: ${updated}`)
