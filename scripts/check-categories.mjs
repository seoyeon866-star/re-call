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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
loadEnv();

async function main() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { count: total } = await sb.from('recalls').select('*', { count: 'exact', head: true });
  console.log(`Total: ${total}`);

  const { count: 기타 } = await sb.from('recalls').select('*', { count: 'exact', head: true }).eq('category', '기타');
  console.log(`기타: ${기타}`);

  const categories = ['유아동','화장품','생활용품','완구류','의류','욕실용품','식품류','주방용품','반려동물','전자제품'];
  for (const c of categories) {
    const { count } = await sb.from('recalls').select('*', { count: 'exact', head: true }).eq('category', c);
    console.log(`  ${c}: ${count}`);
  }
}

main().catch(console.error);
