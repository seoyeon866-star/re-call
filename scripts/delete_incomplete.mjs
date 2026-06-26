import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const fields = ['product_nm', 'makr', 'modl_nm_info', 'shrtcom_cn', 'info_creat_url']
const toDelete = new Set()

for (const f of fields) {
  let offset = 0
  while (true) {
    const { data: batch } = await sb.from('recalls')
      .select('recall_sn')
      .or(`${f}.is.null,${f}.eq.`)
      .range(offset, offset + 999)
    if (!batch || batch.length === 0) break
    for (const r of batch) toDelete.add(r.recall_sn)
    offset += batch.length
    if (batch.length < 1000) break
  }
  console.log(`${f}: ${toDelete.size} unique recall_sn collected so far`)
}

console.log(`\nTotal to delete: ${toDelete.size}`)

if (toDelete.size === 0) { console.log('Nothing to delete'); process.exit(0) }

// Delete in batches
const ids = [...toDelete]
let deleted = 0
for (let i = 0; i < ids.length; i += 1000) {
  const batch = ids.slice(i, i + 1000)
  const { error } = await sb.from('recalls').delete().in('recall_sn', batch)
  if (error) { console.error('Delete error:', error.message); break }
  deleted += batch.length
  console.log(`deleted ${deleted}/${ids.length}`)
}

const { count: remaining } = await sb.from('recalls').select('*', { count: 'exact', head: true })
console.log(`\n✓ Done! Deleted ${deleted}. Remaining: ${remaining}`)
