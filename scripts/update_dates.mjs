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
  const text = await res.text()
  const data = parser.parse(text)
  const channel = data?.selectCntntsForOpenAPIResponse?.channel
  return {
    items: channel?.return?.content
      ? (Array.isArray(channel.return.content) ? channel.return.content : [channel.return.content])
      : [],
    total: parseInt(channel?.return?.allCnt || '0', 10),
  }
}

// Build date map from all Consumer24 pages
const first = await fetchPage(1)
const totalPages = Math.ceil(first.total / 100)
console.log(`Fetching ${totalPages} pages from Consumer24...`)

const dateMap = new Map()
const CONCURRENCY = 10

for (let start = 1; start <= totalPages; start += CONCURRENCY) {
  const end = Math.min(start + CONCURRENCY - 1, totalPages)
  const pages = []
  for (let p = start; p <= end; p++) pages.push(p)

  const results = await Promise.allSettled(pages.map(p => fetchPage(p)))
  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const item of result.value.items) {
      if (item.recallSn && item.recallPublictBgnde) {
        const d = String(item.recallPublictBgnde)
        const date = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`
        dateMap.set(item.recallSn, date)
      }
    }
  }

  if (start % (CONCURRENCY * 10) === 0 || end >= totalPages) {
    console.log(`  fetched ${end}/${totalPages} pages, ${dateMap.size} dates`)
  }
}

console.log(`\nTotal dates collected: ${dateMap.size}`)

// Filter to only records still in our DB (paginate to get all)
const existingSet = new Set()
let offset = 0
while (true) {
  const { data: batch, error } = await sb.from('recalls').select('recall_sn').range(offset, offset + 999)
  if (error || !batch || batch.length === 0) break
  for (const r of batch) existingSet.add(r.recall_sn)
  offset += batch.length
  if (batch.length < 1000) break
}
console.log(`Existing records in DB: ${existingSet.size}`)

const toUpdate = [...dateMap.keys()].filter(k => existingSet.has(k))
console.log(`Records to update: ${toUpdate.length}`)

// Batch update with parallelism
let updated = 0
const BATCH = 50

for (let i = 0; i < toUpdate.length; i += BATCH) {
  const batch = toUpdate.slice(i, i + BATCH)
  const results = await Promise.allSettled(
    batch.map(sn => sb.from('recalls').update({ recall_reg_dt: dateMap.get(sn) }).eq('recall_sn', sn))
  )
  updated += results.filter(r => r.status === 'fulfilled').length

  if ((i + BATCH) % 2000 === 0 || (i + BATCH) >= toUpdate.length) {
    console.log(`  updated ${updated}/${toUpdate.length}`)
  }
}

console.log(`\n✓ Done! Updated ${updated} records with dates`)
