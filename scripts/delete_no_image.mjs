import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { count: total } = await sb.from('recalls').select('*', { count: 'exact', head: true })
const { count: withImg } = await sb.from('recalls').select('*', { count: 'exact', head: true }).not('recall_img_urls', 'is', null).neq('recall_img_urls', '')
const toDelete = total - withImg
console.log(`total: ${total}, with images: ${withImg}, to delete: ${toDelete}`)

// Delete in batches
let deleted = 0
while (deleted < toDelete) {
  const { data: batch, error: qErr } = await sb.from('recalls')
    .select('recall_sn')
    .or(`recall_img_urls.is.null,recall_img_urls.eq.${''}`)
    .limit(1000)
  if (qErr) { console.error('Query error:', qErr.message); break }
  if (!batch || batch.length === 0) break
  const ids = batch.map(r => r.recall_sn)
  const { error } = await sb.from('recalls').delete().in('recall_sn', ids)
  if (error) { console.error('Delete error:', error.message); break }
  deleted += ids.length
  console.log(`deleted ${deleted}/${toDelete}`)
}

const { count: remaining } = await sb.from('recalls').select('*', { count: 'exact', head: true })
console.log(`\n✓ Done. Remaining: ${remaining}`)
