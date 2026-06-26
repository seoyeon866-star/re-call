import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// All 미상 records
const { data: all } = await sb.from('recalls').select('product_nm,makr,recall_sn,category').like('product_nm', '미상%')
console.log('미상 records:')
for (const r of all) {
  console.log(`  [${r.recall_sn}] "${r.product_nm}" | makr: ${r.makr} | cat: ${r.category}`)
}

// Check 기타 records count
const { count: etc } = await sb.from('recalls').select('*', { count: 'exact', head: true }).or('category.eq.기타,category.is.null')
console.log('\n기타 or null:', etc)
