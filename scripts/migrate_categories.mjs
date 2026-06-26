import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const MAP = {
  '유아동': '키즈',
  '완구류': '키즈',
  '화장품': '뷰티헬스',
  '욕실용품': '생활용품',
  '식품류': '식품키친',
  '주방용품': '식품키친',
  '전자제품': '가전디지털',
}

let total = 0
for (const [oldCat, newCat] of Object.entries(MAP)) {
  const { data: batch } = await sb.from('recalls').select('recall_sn').eq('category', oldCat)
  if (!batch || batch.length === 0) { console.log(`${oldCat} → ${newCat}: 0`); continue }
  const ids = batch.map(r => r.recall_sn)
  // update in chunks of 100
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    const { error } = await sb.from('recalls').update({ category: newCat }).in('recall_sn', chunk)
    if (error) console.error('Error:', error.message)
  }
  total += ids.length
  console.log(`${oldCat} → ${newCat}: ${ids.length}`)
}

console.log(`\n✓ Migrated ${total} records`)
