import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Check null vs 기타
const { count: nullCat } = await sb.from('recalls').select('*', { count: 'exact', head: true }).is('category', null)
console.log('category IS NULL:', nullCat)

const { count: etcCat } = await sb.from('recalls').select('*', { count: 'exact', head: true }).eq('category', '기타')
console.log('category = 기타:', etcCat)

const { count: total } = await sb.from('recalls').select('*', { count: 'exact', head: true })
console.log('total:', total)

// with images
const { count: wImg } = await sb.from('recalls').select('*', { count: 'exact', head: true }).not('recall_img_urls', 'is', null).neq('recall_img_urls', '')
console.log('with images:', wImg)

// 기타 + images
const { count: ewi } = await sb.from('recalls').select('*', { count: 'exact', head: true }).eq('category', '기타').not('recall_img_urls', 'is', null).neq('recall_img_urls', '')
console.log('기타 + images:', ewi)

// null + images
const { count: nwi } = await sb.from('recalls').select('*', { count: 'exact', head: true }).is('category', null).not('recall_img_urls', 'is', null).neq('recall_img_urls', '')
console.log('null + images:', nwi)

// null + 기타 + images combined
console.log('null|기타 + images total:', ewi + nwi)
