import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { translate } from '@vitalets/google-translate-api';

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

async function translateText(text, retries = 3) {
  if (!text || text.length < 2) return text;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await translate(text.substring(0, 2000), { from: 'en', to: 'ko' });
      return result.text;
    } catch (e) {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 2000));
      else return text;
    }
  }
}

async function main() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: allRows, error } = await sb.from('recalls').select('recall_sn, product_nm, makr, shrtcom_cn, category');
  // Skip already translated (contains Korean chars)
  const rows = allRows.filter(r => !r.shrtcom_cn || !/[\uAC00-\uD7AF]/.test(r.shrtcom_cn));
  if (error) { console.error(error); return; }
  console.log('Total records to translate:', rows.length);

  let translated = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let makr_ko = row.makr;
    let desc_ko = row.shrtcom_cn;

    // Translate makr if it looks like English
    if (row.makr && /[a-zA-Z]/.test(row.makr) && !/^[^a-zA-Z]*$/.test(row.makr)) {
      makr_ko = await translateText(row.makr);
    }

    // Translate description
    if (row.shrtcom_cn) {
      desc_ko = await translateText(row.shrtcom_cn);
    }

    if (makr_ko !== row.makr || desc_ko !== row.shrtcom_cn) {
      await sb.from('recalls').update({ makr: makr_ko, shrtcom_cn: desc_ko }).eq('recall_sn', row.recall_sn);
      translated++;
    }

    if ((i + 1) % 10 === 0) {
      console.log(Math.round((i + 1) / rows.length * 100) + '% | ' + (i + 1) + '/' + rows.length);
    }
  }
  console.log('Done! Translated ' + translated + '/' + rows.length + ' records.');
}

main().catch(console.error);
