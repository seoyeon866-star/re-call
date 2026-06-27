import { createClient } from '@supabase/supabase-js';
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

const CATEGORIES = ['키즈', '뷰티·헬스', '생활용품', '의류', '식품·키친', '차량용품', '반려동물', '가전·디지털'];

const raw = JSON.parse(readFileSync('/tmp/overseas_data.json', 'utf-8'));
console.log('Total items to process:', raw.length);

// Strip HTML tags
function stripHtml(s) {
  return s.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

const BATCH_SIZE = 15;
let results = [];

for (let i = 0; i < raw.length; i += BATCH_SIZE) {
  const batch = raw.slice(i, i + BATCH_SIZE);
  const items = batch.map((r, idx) => ({
    id: i + idx,
    productNm: r.productNm,
    makr: r.makr,
    shrtcomCn: stripHtml(r.shrtcomCn).substring(0, 500),
  }));

  const prompt = `You are a Korean recall information specialist. Translate the following overseas product recall data into natural Korean and classify each item.

For each item, return a JSON object with these fields:
- id: the item's id
- productNm_ko: Korean translation of product name (natural, like Korean consumer reports)
- makr_ko: Korean translation of manufacturer name (leave as-is if it's a proper brand name in English)
- shrtcomCn_ko: Korean translation of the defect description (natural Korean)
- category: one of these categories: ${CATEGORIES.join(', ')}
- riskTags: array of risk tags from (화재, 감전, 질식, 유해물질, 화상, 불량, 알레르기, 질병, 파손) - choose ALL that apply based on the defect description

Return ONLY a JSON array, no other text.

Items:
${JSON.stringify(items, null, 2)}`;

  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });
      response = await res.json();
      if (response.choices && response.choices[0]) break;
      console.log('  Retry ' + (attempt + 1) + ': ' + (response.error?.message || 'unknown error'));
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log('  Retry ' + (attempt + 1) + ': ' + e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!response || !response.choices) {
    console.log('Batch ' + (i / BATCH_SIZE + 1) + ' FAILED');
    continue;
  }

  let parsed;
  try {
    const text = response.choices[0].message.content;
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.log('Batch ' + (i / BATCH_SIZE + 1) + ' parse error:', e.message);
    continue;
  }

  for (const item of parsed) {
    const orig = batch[item.id - i];
    if (!orig) continue;
    results.push({
      ...orig,
      productNm_ko: item.productNm_ko || orig.productNm,
      makr_ko: item.makr_ko || orig.makr,
      shrtcomCn_ko: item.shrtcomCn_ko || orig.shrtcomCn,
      category: item.category || '',
      riskTags: item.riskTags || [],
    });
  }

  const pct = Math.round(Math.min(100, ((i + BATCH_SIZE) / raw.length) * 100));
  console.log(pct + '% | Batch ' + (i / BATCH_SIZE + 1) + '/' + Math.ceil(raw.length / BATCH_SIZE) + ' | ' + results.length + ' processed');
}

console.log('\nTotal processed: ' + results.length);
writeFileSync('/tmp/translated_data.json', JSON.stringify(results, null, 2));

// Save to Supabase
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Group by category and pick 20 per category
const perCategory = {};
for (const r of results) {
  const cat = r.category || '기타';
  if (!perCategory[cat]) perCategory[cat] = [];
  perCategory[cat].push(r);
}

console.log('\nCategory distribution:');
let toInsert = [];
for (const [cat, items] of Object.entries(perCategory)) {
  const pick = items.slice(0, 20);
  console.log('  ' + cat + ': ' + items.length + ' available, picking ' + pick.length);
  for (const r of pick) {
    toInsert.push({
      recall_sn: r.recallSn,
      cntnts_id: '0501',
      product_nm: r.productNm_ko,
      makr: r.makr_ko,
      shrtcom_cn: r.shrtcomCn_ko,
      recall_img_urls: r.recallImgUrls,
      info_creat_url: r.infoCreatUrl,
      recall_reg_dt: r.recallRegDt,
      recall_se: r.recallSe || '',
      category: cat,
    });
  }
}

console.log('\nTotal to insert: ' + toInsert.length);

if (toInsert.length > 0) {
  // Delete old data first
  await sb.from('recalls').delete().neq('recall_sn', '');
  console.log('Old data deleted');

  // Insert in batches
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { error } = await sb.from('recalls').upsert(batch, { onConflict: 'recall_sn' });
    if (error) console.error('Insert error:', error.message);
    else console.log('Inserted ' + Math.min(i + 100, toInsert.length) + '/' + toInsert.length);
  }
}

console.log('Done!');
