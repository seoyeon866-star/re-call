import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const parser = new XMLParser({
  ignoreAttributes: false, removeNSPrefix: true,
  isArray: (name) => name === 'item',
})

async function fetchPage(pageNo) {
  const url = new URL('https://www.consumer.go.kr/openapi/recall/contents/index.do')
  url.searchParams.set('serviceKey', env.CONSUMER24_SERVICE_KEY)
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('cntPerPage', '100')
  url.searchParams.set('cntntsId', '0501')
  url.searchParams.set('productNm', '')
  const res = await fetch(url.toString())
  return parser.parse(await res.text())
}

// Get total pages
const first = await fetchPage(1)
const total = parseInt(first?.selectCntntsForOpenAPIResponse?.channel?.return?.allCnt || '0', 10)
const totalPages = Math.ceil(total / 100)
console.log(`Fetching ${totalPages} pages...`)

const urlMap = new Map()
const CONCURRENCY = 10

for (let start = 1; start <= totalPages; start += CONCURRENCY) {
  const end = Math.min(start + CONCURRENCY - 1, totalPages)
  const pages = []
  for (let p = start; p <= end; p++) pages.push(p)

  const results = await Promise.allSettled(pages.map(p => fetchPage(p)))
  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    const items = result.value?.selectCntntsForOpenAPIResponse?.channel?.return?.content
    const arr = Array.isArray(items) ? items : [items || []]
    for (const item of arr) {
      if (item.recallSn && item.infoCreatUrl) {
        let cleanUrl = item.infoCreatUrl.trim()
        // Fix malformed URLs with %/ pattern
        if (cleanUrl.includes('%/')) cleanUrl = cleanUrl.replace('%/', '/')
        urlMap.set(item.recallSn, cleanUrl)
      }
    }
  }

  if (start % (CONCURRENCY * 10) === 0 || end >= totalPages) {
    console.log(`  fetched ${end}/${totalPages} pages, ${urlMap.size} urls`)
  }
}

console.log(`\nTotal urls collected: ${urlMap.size}`)

// Get existing recall_sns from DB (paginate)
const existingSet = new Set()
let offset = 0
while (true) {
  const { data: batch } = await sb.from('recalls').select('recall_sn').range(offset, offset + 999)
  if (!batch || batch.length === 0) break
  for (const r of batch) existingSet.add(r.recall_sn)
  offset += batch.length
  if (batch.length < 1000) break
}
console.log(`Existing records: ${existingSet.size}`)

const toUpdate = [...urlMap.keys()].filter(k => existingSet.has(k))
console.log(`Records to update: ${toUpdate.length}`)

// Batch update
let updated = 0
const BATCH = 50
for (let i = 0; i < toUpdate.length; i += BATCH) {
  const batch = toUpdate.slice(i, i + BATCH)
  const results = await Promise.allSettled(
    batch.map(sn => sb.from('recalls').update({ info_creat_url: urlMap.get(sn) }).eq('recall_sn', sn))
  )
  updated += results.filter(r => r.status === 'fulfilled').length
  if ((i + BATCH) % 2000 === 0 || (i + BATCH) >= toUpdate.length) {
    console.log(`  updated ${updated}/${toUpdate.length}`)
  }
}

console.log(`\n✓ Done! Updated ${updated} records`)
