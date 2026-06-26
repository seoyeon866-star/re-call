import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Count to delete
const { count: toDel, error: cErr } = await sb.from('recalls')
  .select('*', { count: 'exact', head: true })
  .or('recall_reg_dt.lte.2023-12-31,recall_reg_dt.is.null,recall_reg_dt.eq.')
console.log('records to delete (<=2023 or no date):', toDel)

if (toDel === 0) { console.log('Nothing to delete'); process.exit(0) }

// Delete in batches
let deleted = 0
while (true) {
  const { data: batch, error: qErr } = await sb.from('recalls')
    .select('recall_sn')
    .or('recall_reg_dt.lte.2023-12-31,recall_reg_dt.is.null,recall_reg_dt.eq.')
    .limit(1000)
  if (qErr) { console.error('Query error:', qErr.message); break }
  if (!batch || batch.length === 0) break
  const ids = batch.map(r => r.recall_sn)
  const { error } = await sb.from('recalls').delete().in('recall_sn', ids)
  if (error) { console.error('Delete error:', error.message); break }
  deleted += ids.length
  console.log(`deleted ${deleted}/${toDel}`)
}

const { count: remaining } = await sb.from('recalls').select('*', { count: 'exact', head: true })
console.log(`\n✓ Done! Deleted ${deleted}. Remaining: ${remaining}`)
