import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter(Boolean).map(l => {
    const [k, ...v] = l.split('=')
    return [k, v.join('=')]
  })
)

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: recalls, error } = await sb.from('recalls')
  .select('recall_sn, info_creat_url, recall_img_urls')
  .ilike('info_creat_url', '%safetykorea.kr%')

if (error) throw error
console.log(`Total safetykorea records: ${recalls.length}`)

let ok = 0
let skip = 0
let fail = 0

for (const rec of recalls) {
  const pageUrl = rec.info_creat_url
  if (!pageUrl) { skip++; continue }

  try {
    const html = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }).then(r => r.text())

    const imgUrls = extractOfficeImages(html)
    if (imgUrls.length === 0) { skip++; continue }

    const storageUrls = []
    for (const imgUrl of imgUrls) {
      const stored = await downloadAndStore(rec.recall_sn, imgUrl)
      if (stored) storageUrls.push(stored)
    }

    if (storageUrls.length > 0) {
      const { error: upErr } = await sb.from('recalls')
        .update({ recall_img_urls: JSON.stringify(storageUrls) })
        .eq('recall_sn', rec.recall_sn)
      if (upErr) console.error(`[DB UPDATE FAIL] ${rec.recall_sn}: ${upErr.message}`)
      else { ok++; continue }
    }
    fail++
  } catch (e) {
    console.error(`[ERROR] ${rec.recall_sn}: ${e.message}`)
    fail++
  }
}

console.log(`\nDone. OK: ${ok}, Skipped (no img): ${skip}, Failed: ${fail}`)

function extractOfficeImages(html) {
  const regex = /<img[^>]+src="(https?:\/\/office\.safetykorea\.kr\/[^"]+)"/gi
  const urls = []
  let match
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1])
  }
  return [...new Set(urls)]
}

async function downloadAndStore(recallSn, imgUrl) {
  const resp = await fetch(imgUrl)
  if (!resp.ok) return null
  const buf = await resp.arrayBuffer()
  if (buf.byteLength === 0) return null

  const ext = (imgUrl.match(/\.(png|jpg|jpeg|gif|webp)/i) || [])[1] || 'jpg'
  const id = imgUrl.match(/fileData\/([^?]+)/)?.[1]?.replace(/[\/\\]/g, '_') || `${recallSn}`
  const filename = `${recallSn}_${id}`

  const { error } = await sb.storage
    .from('recall-images')
    .upload(filename, Buffer.from(buf), {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    })

  if (error) return null

  const { data: urlData } = sb.storage.from('recall-images').getPublicUrl(filename)
  console.log(`  [OK] ${filename}`)
  return urlData.publicUrl
}
