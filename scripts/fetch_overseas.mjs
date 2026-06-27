import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'fs';

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

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, isArray: (n) => n === 'item' });

function has(v) { const s = v && String(v).trim(); return s && s !== '-'; }

async function fetchPage(pn, retries = 3) {
  for (let i = 1; i <= retries; i++) {
    try {
      const u = 'https://www.consumer.go.kr/openapi/recall/contents/index.do?serviceKey=' + process.env.CONSUMER24_SERVICE_KEY + '&pageNo=' + pn + '&cntPerPage=100&cntntsId=0501&productNm=';
      const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
      const d = parser.parse(await res.text());
      const items = d?.selectCntntsForOpenAPIResponse?.channel?.return?.content || [];
      return items;
    } catch (e) {
      if (i < retries) { await new Promise(r => setTimeout(r, 3000 * i)); continue; }
      return [];
    }
  }
}

async function main() {
  const MAX_PAGES = 25;
  let all = [];

  for (let p = 1; p <= MAX_PAGES; p++) {
    const items = await fetchPage(p);
    for (const raw of items) {
      const nm = String(raw.productNm || '');
      const mk = String(raw.makr || '');
      const sc = String(raw.shrtcomCn || '');
      const img = String(raw.recallImgUrls || '');
      const url = String(raw.infoCreatUrl || '');
      const dt = String(raw.recallPublictBgnde || '');
      if (!has(nm) || !has(mk) || !has(sc) || !has(img) || !has(url) || !has(dt)) continue;
      all.push({
        recallSn: String(raw.recallSn || ''),
        productNm: nm,
        makr: mk,
        shrtcomCn: sc,
        recallImgUrls: img,
        infoCreatUrl: url,
        recallRegDt: dt,
        recallSe: String(raw.recallSe || ''),
      });
    }
    console.log('Page ' + p + ': collected ' + all.length + ' valid items');
  }

  console.log('\nTotal valid items: ' + all.length);
  writeFileSync('/tmp/overseas_data.json', JSON.stringify(all, null, 2));
  console.log('Saved to /tmp/overseas_data.json');
}

main().catch(console.error);
