import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';

function loadEnv() {
  const text = readFileSync('.env', 'utf-8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
loadEnv();

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  isArray: (name) => name === 'item',
});

const THREE_YEARS_AGO = '20230626';

function toStr(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function hasValue(v) {
  const s = toStr(v);
  return s.length > 0 && s !== '-';
}

function toRow(raw) {
  const recallSn = toStr(raw.recallSn);
  if (!recallSn) return null;

  const productNm = toStr(raw.productNm);
  const makr = toStr(raw.makr);
  const shrtcomCn = toStr(raw.shrtcomCn);
  const recallImgUrls = toStr(raw.recallImgUrls);
  const infoCreatUrl = toStr(raw.infoCreatUrl);
  const recallDate = toStr(raw.recallPublictBgnde || raw.recallBgnde);

  if (!hasValue(productNm)) return null;
  if (!hasValue(makr)) return null;
  if (!hasValue(shrtcomCn)) return null;
  if (!hasValue(recallImgUrls)) return null;
  if (!hasValue(infoCreatUrl)) return null;
  if (!hasValue(recallDate)) return null;
  if (recallDate < THREE_YEARS_AGO) return null;

  return {
    recall_sn: recallSn,
    cntnts_id: toStr(raw.cntntsId),
    product_nm: productNm,
    makr,
    bsnm_nm: toStr(raw.bsnmNm),
    modl_nm_info: toStr(raw.modlNmInfo),
    shrtcom_cn: shrtcomCn,
    recall_se: toStr(raw.recallSe),
    hrmfl_grad: toStr(raw.hrmflGrad),
    main_sleoffic: toStr(raw.mainSleoffic),
    recall_img_urls: recallImgUrls,
    injry_cause_result: toStr(raw.injryCauseResult),
    cnsmr_ghvr_tips: toStr(raw.cnsmrGhvrTips),
    aditfield13: toStr(raw.aditfield13),
    recall_reg_dt: recallDate,
    info_creat_url: infoCreatUrl,
    category: '',
  };
}

async function fetchPage(pageNo, cntPerPage = 100, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = new URL('https://www.consumer.go.kr/openapi/recall/contents/index.do');
      url.searchParams.set('serviceKey', process.env.CONSUMER24_SERVICE_KEY);
      url.searchParams.set('pageNo', String(pageNo));
      url.searchParams.set('cntPerPage', String(cntPerPage));
      url.searchParams.set('cntntsId', '0501');
      url.searchParams.set('productNm', '');
      const res = await fetch(url.toString());
      const text = await res.text();
      const data = xmlParser.parse(text);
      const channel = data?.selectCntntsForOpenAPIResponse?.channel;
      return {
        items: channel?.return?.content
          ? (Array.isArray(channel.return.content) ? channel.return.content : [channel.return.content])
          : [],
        total: parseInt(channel?.return?.allCnt || '0', 10),
      };
    } catch (e) {
      if (attempt < retries) {
        console.log(`  Retry page ${pageNo} (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
      } else {
        throw e;
      }
    }
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }
  const sb = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching first page to get total count...');
  const first = await fetchPage(1);
  const total = first.total;
  const totalPages = Math.ceil(total / 100);
  console.log(`Total items from Consumer24: ${total}, pages: ${totalPages}`);

  let validRows = [];
  let skipped_no_product = 0;
  let skipped_no_makr = 0;
  let skipped_no_desc = 0;
  let skipped_no_img = 0;
  let skipped_no_url = 0;
  let skipped_no_date = 0;
  let skipped_old = 0;

  const CONCURRENCY = 3;

  for (let startPage = 1; startPage <= totalPages; startPage += CONCURRENCY) {
    const endPage = Math.min(startPage + CONCURRENCY - 1, totalPages);
    const pageNumbers = [];
    for (let p = startPage; p <= endPage; p++) pageNumbers.push(p);

    const results = await Promise.allSettled(
      pageNumbers.map(p => fetchPage(p).then(r => ({ page: p, ...r })))
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`  Page fetch error:`, result.reason);
        continue;
      }
      const { items } = result.value;
      for (const raw of items) {
        const row = toRow(raw);
        if (!row) {
          if (!hasValue(raw.productNm)) skipped_no_product++;
          else if (!hasValue(raw.makr)) skipped_no_makr++;
          else if (!hasValue(raw.shrtcomCn)) skipped_no_desc++;
          else if (!hasValue(raw.recallImgUrls)) skipped_no_img++;
          else if (!hasValue(raw.infoCreatUrl)) skipped_no_url++;
          else if (!hasValue(raw.recallPublictBgnde) && !hasValue(raw.recallBgnde)) skipped_no_date++;
          else skipped_old++;
          continue;
        }
        validRows.push(row);
      }
    }

    if (startPage % (CONCURRENCY * 10) === 0 || endPage >= totalPages) {
      const pct = Math.min(100, Math.round((endPage / totalPages) * 100));
      console.log(`${pct}% | page ${endPage}/${totalPages} | ${validRows.length} valid so far`);
    }
  }

  console.log('\n=== Filter results ===');
  console.log(`Valid records: ${validRows.length}`);
  console.log(`Skipped - no product name: ${skipped_no_product}`);
  console.log(`Skipped - no manufacturer: ${skipped_no_makr}`);
  console.log(`Skipped - no description: ${skipped_no_desc}`);
  console.log(`Skipped - no image: ${skipped_no_img}`);
  console.log(`Skipped - no source URL: ${skipped_no_url}`);
  console.log(`Skipped - no date: ${skipped_no_date}`);
  console.log(`Skipped - older than 3yr: ${skipped_old}`);

  if (validRows.length === 0) {
    console.log('No valid records to insert. Exiting.');
    return;
  }

  console.log('\nDeleting all existing data...');
  const { error: delErr } = await sb.from('recalls').delete().neq('recall_sn', '');
  if (delErr) {
    console.error('Delete error:', delErr.message);
    process.exit(1);
  }
  console.log('Existing data deleted.');

  console.log(`\nInserting ${validRows.length} records...`);
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);
    const { error } = await sb.from('recalls').upsert(batch, { onConflict: 'recall_sn' });
    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
    } else {
      inserted += batch.length;
    }
    if ((i / BATCH_SIZE + 1) % 10 === 0 || i + BATCH_SIZE >= validRows.length) {
      console.log(`  ${Math.min(100, Math.round((inserted / validRows.length) * 100))}% | ${inserted}/${validRows.length}`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} records.`);
}

main().catch(console.error);
