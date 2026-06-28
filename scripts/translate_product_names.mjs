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

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function translate(text) {
  if (!text || /^[\uac00-\ud7af\s]+$/.test(text)) return null;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data?.[0]?.[0]?.[0]) return data[0][0][0];
  } catch {}
  return null;
}

async function main() {
  const { data: items } = await sb.from('recalls').select('recall_sn, product_nm');
  let updated = 0;

  for (const item of items) {
    const nm = item.product_nm;
    if (/^[\uac00-\ud7af\s]+$/.test(nm)) continue;

    let translated;
    if (nm.includes(' ; ')) {
      const parts = nm.split(' ; ');
      if (parts.length >= 3) {
        const prefix = await translate(parts[0]);
        if (prefix) {
          parts[0] = prefix;
          translated = parts.join(' ; ');
        }
      } else if (parts.length === 2) {
        const prefix = await translate(parts[0]);
        if (prefix) {
          parts[0] = prefix;
          translated = parts.join(' ; ');
        }
      }
    } else {
      translated = await translate(nm);
    }

    if (translated && translated !== nm) {
      await sb.from('recalls').update({ product_nm: translated }).eq('recall_sn', item.recall_sn);
      console.log(`${item.recall_sn}: ${nm} → ${translated}`);
      updated++;
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\nUpdated ${updated} products`);
}

main().catch(console.error);
