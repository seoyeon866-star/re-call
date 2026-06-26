import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// First, show what we're deleting
const { data: toDelete } = await sb.from('recalls').select('recall_sn,product_nm,makr,category').eq('product_nm', '미상')
console.log(`Deleting ${toDelete.length} records where product_nm = '미상':`)
for (const r of toDelete) {
  console.log(`  ${r.recall_sn} | makr: ${r.makr} | cat: ${r.category}`)
}

// Delete
const { error } = await sb.from('recalls').delete().eq('product_nm', '미상')
if (error) {
  console.error('Delete error:', error.message)
  process.exit(1)
}

console.log(`\n✓ Deleted ${toDelete.length} records successfully`)

// Verify
const { count } = await sb.from('recalls').select('*', { count: 'exact', head: true })
console.log(`Total remaining records: ${count}`)
