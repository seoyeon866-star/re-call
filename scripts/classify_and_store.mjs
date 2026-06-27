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

const CATEGORY_KEYWORDS = [
  { category: '키즈', keywords: 'baby infant child children kids toy stroller pram car seat crib pacifier bottle diaper doll plush teddy stuffed puzzle stroller carseat juvenile bib sleeping bag swaddle high chair'.split(' ') },
  { category: '뷰티·헬스', keywords: 'cosmetic makeup lipstick cream lotion moisturizer serum sunscreen shampoo soap deodorant perfume fragrance nail polish lip balm cleanser face wash beauty skin care hair care toothpaste bandage band-aid first aid health supplement vitamin medical surgical mask'.split(' ') },
  { category: '생활용품', keywords: 'detergent cleaner cleaning furniture table chair shelf storage container towel bathroom sponge laundry hanger iron water bottle tumbler flask lunch box candle air freshener adhesive tape light bulb lamp'.split(' ') },
  { category: '의류', keywords: 'clothing garment apparel shirt pants trousers jeans shorts skirt dress jacket coat suit sweater hoodie underwear sock shoes sneaker boot sandal slipper hat cap glove belt textile fabric leather fur down'.split(' ') },
  { category: '식품·키친', keywords: 'food snack drink beverage juice milk yogurt cheese bread cake cookie biscuit chocolate candy cereal rice pasta noodle soup sauce oil kitchen pan pot knife cutting board bowl plate cup mug glass'.split(' ') },
  { category: '차량용품', keywords: 'car vehicle auto automobile truck motorcycle bicycle bike e-bike scooter tire brake engine battery seat belt airbag helmet child seat car seat booster seat'.split(' ') },
  { category: '반려동물', keywords: 'pet dog cat puppy kitten fish bird pet food dog food cat food pet toy dog toy cat toy leash collar harness cage bowl feeder litter'.split(' ') },
  { category: '가전·디지털', keywords: 'electronic charger battery power bank cable earphone headphone speaker camera phone smartphone tablet computer laptop monitor TV television keyboard mouse USB lamp light fan heater humidifier air purifier vacuum blender microwave toaster kettle'.split(' ') },
];

const RISK_KEYWORDS_EN = [
  { tag: '화재', keywords: 'fire flame burn overheat explode explosion spark ignite catch fire melt smoke heat'.split(' ') },
  { tag: '감전', keywords: 'electric shock electrocution short circuit exposed wire insulation failure'.split(' ') },
  { tag: '질식', keywords: 'choke choking suffocate strangulation small part ingest swallow inhalation entrapment'.split(' ') },
  { tag: '유해물질', keywords: 'toxic poison lead cadmium phthalate BPA carcinogen chemical heavy metal mercury formaldehyde benzene'.split(' ') },
  { tag: '화상', keywords: 'burn scald hot surface hot liquid steam high temperature'.split(' ') },
  { tag: '불량', keywords: 'defect malfunction failure break crack fracture sharp edge injury fall tip-over crush pinch laceration'.split(' ') },
  { tag: '알레르기', keywords: 'allergy allergic skin irritation rash itch dermatitis'.split(' ') },
  { tag: '질병', keywords: 'disease infection bacteria virus mold salmonella contamination food poisoning pathogen'.split(' ') },
  { tag: '파손', keywords: 'break breakage crack fracture shatter splinter chip rupture burst collapse'.split(' ') },
];

function classifyCategory(productNm, makr, shrtcomCn) {
  const text = (productNm + ' ' + makr + ' ' + shrtcomCn).toLowerCase();
  let best = { category: '기타', score: 0 };
  for (const rule of CATEGORY_KEYWORDS) {
    const score = rule.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (score > best.score) best = { category: rule.category, score };
  }
  return best.category;
}

function extractRiskTags(productNm, makr, shrtcomCn) {
  const text = (productNm + ' ' + makr + ' ' + shrtcomCn).toLowerCase();
  return RISK_KEYWORDS_EN.filter(r => r.keywords.some(kw => text.includes(kw.toLowerCase()))).map(r => r.tag);
}

function stripHtml(s) {
  return s.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

async function main() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const raw = JSON.parse(readFileSync('/tmp/overseas_data.json', 'utf-8'));
  console.log('Total raw items:', raw.length);

  const byCategory = {};
  for (const item of raw) {
    const nm = stripHtml(item.productNm);
    const mk = stripHtml(item.makr);
    const sc = stripHtml(item.shrtcomCn).substring(0, 500);
    const cat = classifyCategory(nm, mk, sc);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ ...item, _nm: nm, _mk: mk, _sc: sc });
  }

  const targetCats = ['키즈', '뷰티·헬스', '생활용품', '의류', '식품·키친', '차량용품', '반려동물', '가전·디지털'];
  console.log('\nCategory distribution:');
  for (const cat of targetCats) {
    console.log('  ' + cat + ': ' + (byCategory[cat]?.length || 0));
  }

  const toInsert = [];
  for (const cat of targetCats) {
    const items = byCategory[cat] || [];
    const pick = items.slice(0, 20);
    console.log('  Picking ' + pick.length + ' for ' + cat);
    for (const item of pick) {
      const tags = extractRiskTags(item._nm, item._mk, item._sc);
      toInsert.push({
        recall_sn: item.recallSn,
        cntnts_id: '0501',
        product_nm: item._nm,
        makr: item._mk,
        shrtcom_cn: item._sc,
        recall_img_urls: item.recallImgUrls,
        info_creat_url: item.infoCreatUrl,
        recall_reg_dt: item.recallRegDt,
        recall_se: item.recallSe || '',
        category: cat,
      });
    }
  }

  console.log('\nTotal to insert: ' + toInsert.length);

  await sb.from('recalls').delete().neq('recall_sn', '');
  console.log('Old data deleted');

  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { error } = await sb.from('recalls').upsert(batch, { onConflict: 'recall_sn' });
    if (error) console.error('Insert error:', error.message);
    else console.log('Inserted ' + Math.min(i + 100, toInsert.length) + '/' + toInsert.length);
  }
  console.log('Done!');
}

main().catch(console.error);
