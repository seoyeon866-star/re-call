import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Check date range
const { data: range } = await sb.from('recalls')
  .select('recall_reg_dt')
  .not('recall_reg_dt', 'is', null)
  .neq('recall_reg_dt', '')
  .order('recall_reg_dt', { ascending: true })
  .limit(1)

const { data: range2 } = await sb.from('recalls')
  .select('recall_reg_dt')
  .not('recall_reg_dt', 'is', null)
  .neq('recall_reg_dt', '')
  .order('recall_reg_dt', { ascending: false })
  .limit(1)

console.log('date range:', range?.[0]?.recall_reg_dt, '~', range2?.[0]?.recall_reg_dt)

// null dates count
const { count: nullDt } = await sb.from('recalls').select('*', { count: 'exact', head: true }).or('recall_reg_dt.is.null,recall_reg_dt.eq.')
console.log('null/empty recall_reg_dt:', nullDt)

// Last 3 years (from June 2023)
const { count: recent3 } = await sb.from('recalls')
  .select('*', { count: 'exact', head: true })
  .gte('recall_reg_dt', '2023-01-01')

console.log('>= 2023-01-01:', recent3)

const { count: recent2024 } = await sb.from('recalls')
  .select('*', { count: 'exact', head: true })
  .gte('recall_reg_dt', '2024-01-01')
console.log('>= 2024-01-01:', recent2024)

const { count: recent2025 } = await sb.from('recalls')
  .select('*', { count: 'exact', head: true })
  .gte('recall_reg_dt', '2025-01-01')
console.log('>= 2025-01-01:', recent2025)

// 기타 among recent
const { count: etcRecent } = await sb.from('recalls')
  .select('*', { count: 'exact', head: true })
  .eq('category', '기타')
  .gte('recall_reg_dt', '2023-01-01')
console.log('>= 2023 + 기타:', etcRecent)

// Sample years
const { data: years } = await sb.from('recalls')
  .select('recall_reg_dt')
  .not('recall_reg_dt', 'is', null)
  .neq('recall_reg_dt', '')
  .limit(1000)
const yearCount = {}
for (const r of years) {
  const y = (r.recall_reg_dt || '').slice(0, 4)
  if (y) yearCount[y] = (yearCount[y] || 0) + 1
}
console.log('\nyear distribution (sample 1000):')
for (const [y, n] of Object.entries(yearCount).sort()) {
  console.log(`  ${y}: ${n}`)
}
