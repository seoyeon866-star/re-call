import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

function loadEnv() {
  const text = readFileSync('.env', 'utf-8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value;
  }
}
loadEnv();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const OUT_DIR = 'public/assets/products';

async function isImageBroken(recallImgUrls) {
  const firstUrl = (recallImgUrls || '').split(',')[0]?.trim();
  if (!firstUrl) return true;
  const id = firstUrl.match(/atchmnflId=([^&]+)/)?.[1];
  if (!id) return true;
  try {
    const url = 'https://www.consumer.go.kr/openapi/recall/contents/recallApiImage.do?atchmnflId=' + id + '&serviceKey=' + process.env.CONSUMER24_SERVICE_KEY;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.consumer.go.kr/' } });
    const buf = await res.arrayBuffer();
    return buf.byteLength === 0;
  } catch { return true; }
}

async function searchNaverImage(query) {
  const url = 'https://openapi.naver.com/v1/search/image?query=' + encodeURIComponent(query) + '&display=5&filter=medium';
  const res = await fetch(url, {
    headers: { 'X-Naver-Client-Id': process.env.VITE_NAVER_CLIENT_ID, 'X-Naver-Client-Secret': process.env.VITE_NAVER_CLIENT_SECRET }
  });
  const data = await res.json();
  return (data.items || []).filter(i => i.link && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(i.link)).map(i => i.link);
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 1000) throw new Error('Too small: ' + buf.byteLength);
  writeFileSync(destPath, buf);
  return buf.byteLength;
}

async function main() {
  const { data: all } = await sb.from('recalls').select('*');

  let broken = [];
  for (const r of all) {
    process.stdout.write('.');
    if (r.recall_img_urls?.startsWith('/assets/products/')) { process.stdout.write('s'); continue; }
    if (await isImageBroken(r.recall_img_urls)) broken.push(r);
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('\nBroken images:', broken.length);

  let fetched = 0, skipped = 0;
  const log = [];

  for (let i = 0; i < broken.length; i++) {
    const r = broken[i];
    const query = r.product_nm + ' ' + (r.makr || '');
    const sn = r.recall_sn.replace(/[^a-zA-Z0-9_-]/g, '_');

    const existing = join(OUT_DIR, sn + '.jpg');
    if (existsSync(existing)) { console.log((i+1) + '/' + broken.length + ' SKIP (exists) ' + r.product_nm.substring(0, 40)); skipped++; continue; }

    let links;
    try {
      links = await searchNaverImage(query);
    } catch (e) { console.log('  search error:', e.message); continue; }

    let ok = false;
    for (const link of links) {
      const ext = extname(new URL(link).pathname).split('?')[0] || '.jpg';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
      const dest = join(OUT_DIR, sn + safeExt);
      try {
        const bytes = await downloadImage(link, dest);
        const localPath = '/assets/products/' + sn + safeExt;
        await sb.from('recalls').update({ recall_img_urls: localPath }).eq('recall_sn', r.recall_sn);
        console.log((i+1) + '/' + broken.length + ' OK ' + r.product_nm.substring(0, 40) + ' -> ' + bytes + 'B');
        log.push({ recall_sn: r.recall_sn, product_nm: r.product_nm, success: true, size: bytes });
        ok = true;
        fetched++;
        break;
      } catch (e) {
        console.log('  dl error for', link.substring(0, 60), e.message);
      }
    }
    if (!ok) {
      console.log((i+1) + '/' + broken.length + ' FAIL ' + r.product_nm.substring(0, 40));
      log.push({ recall_sn: r.recall_sn, product_nm: r.product_nm, success: false });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDone. Fetched:', fetched, 'Skipped:', skipped, 'Failed:', log.filter(l => !l.success).length);
  writeFileSync('/tmp/fetch_images_log.json', JSON.stringify(log, null, 2));
}
main().catch(console.error);
