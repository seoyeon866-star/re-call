import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const years = ['2019','2020','2021','2022','2023','2024','2025','2026']
for (const y of years) {
  const { count } = await sb.from('recalls')
    .select('*', { count: 'exact', head: true })
    .gte('recall_reg_dt', `${y}-01-01`)
    .lte('recall_reg_dt', `${y}-12-31`)
  console.log(`${y}: ${count}`)
}

const { count: nullDt } = await sb.from('recalls')
  .select('*', { count: 'exact', head: true })
  .or('recall_reg_dt.is.null,recall_reg_dt.eq.')
console.log('no date:', nullDt)

const { count: total } = await sb.from('recalls').select('*', { count: 'exact', head: true })
console.log('total:', total)
