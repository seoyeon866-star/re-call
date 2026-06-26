import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const fields = [
  'product_nm', 'makr', 'bsnm_nm', 'modl_nm_info', 'shrtcom_cn',
  'recall_se', 'hrmfl_grad', 'main_sleoffic', 'recall_img_urls',
  'injry_cause_result', 'cnsmr_ghvr_tips', 'aditfield13',
  'recall_reg_dt', 'category'
]

for (const f of fields) {
  const { count: c1 } = await sb.from('recalls').select('*', { count: 'exact', head: true }).is(f, null)
  const { count: c2 } = await sb.from('recalls').select('*', { count: 'exact', head: true }).eq(f, '')
  const total = c1 + c2
  if (total > 0) {
    console.log(`${f}: ${total} empty (null: ${c1}, empty: ${c2})`)
  }
}

const { count: total } = await sb.from('recalls').select('*', { count: 'exact', head: true })
console.log(`\ntotal: ${total}`)
