import { createClient } from '@supabase/supabase-js';
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value;
  }
}
loadEnv();

async function gt(text) {
  if (!text || text.length < 2) return text;
  try {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=' + encodeURIComponent(text.substring(0, 2000));
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(s => s[0]).join('');
  } catch (e) {
    return text;
  }
}

async function main() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: all } = await sb.from('recalls').select('recall_sn, makr, shrtcom_cn');
  const rows = all.filter(r => !r.shrtcom_cn || !/[\uAC00-\uD7AF]/.test(r.shrtcom_cn));
  console.log('Remaining to translate:', rows.length);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const desc_ko = await gt(r.shrtcom_cn);

    if (desc_ko !== r.shrtcom_cn) {
      await sb.from('recalls').update({ shrtcom_cn: desc_ko }).eq('recall_sn', r.recall_sn);
    }
    await new Promise(r => setTimeout(r, 500));
    if ((i + 1) % 10 === 0) console.log(Math.round((i + 1) / rows.length * 100) + '% | ' + (i + 1) + '/' + rows.length);
  }
  console.log('Done!');
}
main().catch(console.error);
