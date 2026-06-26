import { createClient } from '@supabase/supabase-js'
import { readFileSync, createWriteStream, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter(Boolean).map(l => {
    const [k, ...v] = l.split('=')
    return [k, v.join('=')]
  })
)

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Fetch all records with image URLs
const { data: recalls, error } = await sb.from('recalls')
  .select('recall_sn, recall_img_urls')
  .not('recall_img_urls', 'is', null)
  .neq('recall_img_urls', '[]')

if (error) throw error
console.log(`Total records with images: ${recalls.length}`)

let success = 0
let fail = 0

for (const rec of recalls) {
  const urls = parseImageUrls(rec.recall_img_urls)
  if (urls.length === 0) continue

  const storageUrls = []
  for (const url of urls) {
    try {
      const storageUrl = await downloadAndUpload(rec.recall_sn, url)
      if (storageUrl) {
        storageUrls.push(storageUrl)
        success++
      } else {
        fail++
      }
    } catch (e) {
      console.error(`[FAIL] ${rec.recall_sn}: ${e.message}`)
      fail++
    }
  }

  if (storageUrls.length > 0) {
    await sb.from('recalls')
      .update({ recall_img_urls: JSON.stringify(storageUrls) })
      .eq('recall_sn', rec.recall_sn)
  }
}

console.log(`\nDone. Success: ${success}, Failed: ${fail}`)

function parseImageUrls(val) {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : [String(val)]
  } catch {
    return val.split(',').map(s => s.trim()).filter(Boolean)
  }
}

async function downloadAndUpload(recallSn, url) {
  const atchId = url.match(/atchmnflId=([^&]+)/)?.[1]
  if (!atchId) return null

  // Try with service key
  const apiUrl = `https://www.consumer.go.kr/openapi/recall/contents/recallApiImage.do?atchmnflId=${atchId}&serviceKey=${env.CONSUMER24_SERVICE_KEY}`

  const resp = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Referer': 'https://www.consumer.go.kr/',
    }
  })

  const arrBuf = await resp.arrayBuffer()
  if (arrBuf.byteLength === 0) {
    // Try without service key
    const url2 = `https://www.consumer.go.kr/openapi/recall/contents/recallApiImage.do?atchmnflId=${atchId}`
    const resp2 = await fetch(url2, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Referer': 'https://www.consumer.go.kr/',
      }
    })
    const buf2 = await resp2.arrayBuffer()
    if (buf2.byteLength === 0) {
      console.log(`[SKIP] ${recallSn}: empty response for ${atchId}`)
      return null
    }
    return uploadBuffer(recallSn, atchId, buf2)
  }

  return uploadBuffer(recallSn, atchId, arrBuf)
}

async function uploadBuffer(recallSn, atchId, buffer) {
  const ext = 'jpg'
  const filename = `${recallSn}_${atchId}.${ext}`

  const { data, error } = await sb.storage
    .from('recall-images')
    .upload(filename, Buffer.from(buffer), {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) {
    console.error(`[UPLOAD FAIL] ${filename}: ${error.message}`)
    return null
  }

  const { data: urlData } = sb.storage
    .from('recall-images')
    .getPublicUrl(filename)

  console.log(`[OK] ${recallSn}: ${filename}`)
  return urlData.publicUrl
}
