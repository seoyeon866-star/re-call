import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  isArray: (name) => name === 'item',
});

let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) _supabase = createClient(url, key);
  }
  return _supabase;
}

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: '키즈', keywords: ['유아', '신생아', '아기', '베이비', '이유식', '유모차', '젖병', '턱받이', '아동', '키즈', '분유', '기저귀', '물티슈', '어린이', '돌보기', '교육', '완구', '장난감', '인형', '블록', '레고', '피규어', '퍼즐', '보드게임', '물놀이', '공', '드론', 'RC', '로봇', '자동차', '비행기', '물총', '놀이', '게임', '큐브', '미니카', '작동', '딸랑이', '치발기', '보행기', '아가', 'stroller', 'pram', 'carseat', '카시트'] },
  { category: '뷰티·헬스', keywords: ['화장품', '크림', '로션', '향수', '립스틱', '마스크팩', '에센스', '선크림', '자외선', '바디', '샴푸', '클렌징', '화장', '메이크업', '아이섀도', '파운데이션', '비비', '마스카라', '립', '토너', '미스트', '세럼', '팩', '스킨케어', '기초', '헤어', '뷰티', '헬스', '마사지', '네일', '아이라이너'] },
  { category: '생활용품', keywords: ['세제', '방향제', '탈취제', '청소용품', '생활', '수납', '정리', '다리미', '빨래', '건조', '보관', '용기', '텀블러', '물병', '도시락', '청소', '먼지', '살균', '소독', '물티슈', '행주', '수세미', '욕실', '샤워', '샤워기', '비누', '칫솔', '치약', '수건', '욕조', '변기', '세면대', '비데', '구강', '면도', '바스', '타월', '핸드워시', '바디워시', '가구', '의자', '테이블', '선반'] },
  { category: '의류', keywords: ['의류', '옷', '점퍼', '티셔츠', '바지', '신발', '자켓', '코트', '운동화', '샌들', '슬리퍼', '부츠', '치마', '원피스', '잠옷', '속옷', '양말', '모자', '벨트', '가방', '패딩', '조끼', '청바지', '후드', '맨투맨', '니트', '스웨터', '재킷', '블라우스', '셔츠', '트레이닝', '레깅스'] },
  { category: '식품·키친', keywords: ['식품', '과자', '음료', '분유', '건강식품', '젤리', '사탕', '초콜릿', '캔디', '비스킷', '쿠키', '시리얼', '소스', '조미료', '김치', '냉동', '가공', '영양제', '건강', '음식', '간식', '차', '주스', '우유', '요구르트', '빵', '떡', '면', '라면', '통조림', '주방', '냄비', '프라이팬', '그릇', '컵', '머그', '칼', '도마', '주전자', '에어프라이어', '밥솥', '토스트', '커피', '티포트', '식기', '접시', '조리', '쿠커', '후라이팬', '찜기', '믹서', '튀김', '전자레인지', '인덕션'] },
  { category: '차량용품', keywords: ['car', 'vehicle', 'auto', 'bicycle', 'bike', 'motorcycle', 'scooter', '타이어', '차량', '자동차', '오토바이', '바이크', '헬멧', 'helmet', 'life jacket', 'life vest', 'buoyancy', '구명', 'motor', 'engine', '배터리', 'electric bicycle', 'e-bike', '킥보드', '카시트', 'carseat', 'harness', 'climbing', '등반'] },
  { category: '반려동물', keywords: ['반려동물', '강아지', '고양이', '사료', '간식', '펫', '애완', '배변', '동물', '개', '캣', '묘', '견', '목줄', '이동장', '급식기', '장난감', '하네스', '리드줄', '켄넬', '쿠션', '방석', '스크래쳐', '모래', '화장실', '물그릇', '식기', '영양제', '훈련', '치석', '브러쉬', '가위', '패드'] },
  { category: '가전·디지털', keywords: ['보조배터리', '충전기', '배터리', '전원', 'USB', '케이블', '이어폰', '헤드폰', '어댑터', '전기', 'LED', '램프', '조명', '선풍기', '히터', '가습기', '공기청정기', '드라이기', '면도기', '전기장판', '온수기', '전자레인지', '믹서기', '블렌더', '전자', '충전', '어댑터', '파워뱅크', '배터리팩', '스피커', '마우스', '키보드', '모니터', '노트북', '스마트폰', '태블릿', 'power bank', 'smartwatch', 'wireless'] },
];

const DOMAIN_MAP: Record<string, string> = {
  'ec.europa.eu': '유럽 집행위원회',
  'www.cpsc.gov': '미국 CPSC',
  'cpsc.gov': '미국 CPSC',
  'recalls-rappels.canada.ca': '캐나다 보건부',
  'www.safetykorea.kr': '한국 제품안전정보센터',
  'www.fda.gov.tw': '대만 FDA',
  'favv-afsca.be': '벨기에 AFSCA',
  'www.productsafety.govt.nz': '뉴질랜드 MBIE',
  'apps.tga.gov.au': '호주 TGA',
  'www.productsafety.gov.au': '호주 제품안전청',
  'conformityhub.moiat.gov.ae': 'UAE MOIAT',
  'www.recall.caa.go.jp': '일본 소비자청',
  'www.gov.uk': '영국 OPSS',
  'www.bsmi.gov.tw': '대만 BSMI',
  'reventazon.meic.go.cr': '코스타리카 MEIC',
  'www.foodstandards.gov.au': '호주 FSANZ',
  'www.food.gov.uk': '영국 FSA',
  'www.fsai.ie': '아일랜드 FSAI',
  'www.lebensmittelwarnung.de': '독일 BVL',
  'www.baua.de': '독일 BAuA',
  'www.nvwa.nl': '네덜란드 NVWA',
  'wwwapps.tc.gc.ca': '캐나다 교통부',
  'rappel.conso.gouv.fr': '프랑스 소비자청',
  'www.fda.gov': '미국 FDA',
}

function getAgencyName(url: string): string {
  try {
    const host = new URL(url).hostname
    return DOMAIN_MAP[host] || host
  } catch {
    return ''
  }
}

function classifyCategory(productNm: string, shrtcomCn: string, modlNmInfo: string): string {
  const text = `${productNm} ${shrtcomCn} ${modlNmInfo}`.toLowerCase();
  let best: { category: string; score: number } = { category: '기타', score: 0 };
  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (score > best.score) best = { category: rule.category, score };
  }
  return best.category;
}

function toRow(raw: Record<string, unknown>) {
  const productNm = (raw.productNm as string) || '';
  const shrtcomCn = (raw.shrtcomCn as string) || '';
  const modlNmInfo = (raw.modlNmInfo as string) || '';
  const category = classifyCategory(productNm, shrtcomCn, modlNmInfo);
  return {
    recall_sn: (raw.recallSn as string) || '',
    cntnts_id: (raw.cntntsId as string) || '',
    product_nm: productNm,
    makr: (raw.makr as string) || '',
    bsnm_nm: (raw.bsnmNm as string) || '',
    modl_nm_info: modlNmInfo,
    shrtcom_cn: shrtcomCn,
    recall_se: (raw.recallSe as string) || '',
    hrmfl_grad: (raw.hrmflGrad as string) || '',
    main_sleoffic: (raw.mainSleoffic as string) || '',
    recall_img_urls: (raw.recallImgUrls as string) || '',
    injry_cause_result: (raw.injryCauseResult as string) || '',
    cnsmr_ghvr_tips: (raw.cnsmrGhvrTips as string) || '',
    aditfield13: (raw.aditfield13 as string) || '',
    recall_reg_dt: (raw.recallRegDt as string) || '',
    info_creat_url: (raw.infoCreatUrl as string) || '',
    category,
  };
}

function toClient(row: any) {
  return {
    recallSn: row.recall_sn,
    cntntsId: row.cntnts_id,
    productNm: row.product_nm,
    makr: row.makr,
    bsnmNm: row.bsnm_nm,
    modlNmInfo: row.modl_nm_info,
    shrtcomCn: row.shrtcom_cn,
    recallSe: row.recall_se,
    hrmflGrad: row.hrmfl_grad,
    mainSleoffic: row.main_sleoffic,
    recallImgUrls: row.recall_img_urls,
    injryCauseResult: row.injry_cause_result,
    cnsmrGhvrTips: row.cnsmr_ghvr_tips,
    aditfield13: row.aditfield13,
    recallRegDt: row.recall_reg_dt,
    category: row.category,
    infoCreatUrl: row.info_creat_url || '',
    agencyName: getAgencyName(row.info_creat_url || ''),
  };
}

async function fetchFromConsumer(keyword: string) {
  const url = new URL('https://www.consumer.go.kr/openapi/recall/contents/index.do');
  url.searchParams.set('serviceKey', process.env.CONSUMER24_SERVICE_KEY!);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('cntPerPage', '100');
  url.searchParams.set('cntntsId', '0501');
  url.searchParams.set('productNm', keyword);
  const res = await fetch(url.toString());
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('json') || text.trim().startsWith('{')
    ? JSON.parse(text)
    : xmlParser.parse(text);
  const channel = (data as any)?.selectCntntsForOpenAPIResponse?.channel;
  return channel?.return?.content
    ? (Array.isArray(channel.return.content) ? channel.return.content : [channel.return.content])
    : [];
}

function hasImage(row: any) {
  return row.recall_img_urls && row.recall_img_urls.trim().length > 0;
}

function applyImageFilter(query: any) {
  return query.not('recall_img_urls', 'is', null).neq('recall_img_urls', '');
}

async function queryDBRecent() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const categories = ['키즈', '뷰티·헬스', '생활용품', '의류', '식품·키친', '차량용품', '반려동물', '가전·디지털'];
    const results: any[] = [];
    for (const cat of categories) {
      const q = applyImageFilter(sb.from('recalls').select('*').eq('category', cat));
      const { data, error } = await q.order('recall_reg_dt', { ascending: false, nullsFirst: false }).limit(1);
      if (!error && data && data.length > 0) results.push(data[0]);
    }
    return results.length > 0 ? results.map(toClient) : null;
  } catch { return null; }
}

async function queryDBCategory(category: string) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const q = applyImageFilter(sb.from('recalls').select('*').eq('category', category));
    const { data, error } = await q.order('recall_reg_dt', { ascending: false, nullsFirst: false }).limit(100);
    if (error) throw error;
    return data && data.length > 0 ? data.map(toClient) : null;
  } catch { return null; }
}

async function queryDBSearch(q: string) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const words = q.split(/\s+/).filter(Boolean);
    // Try AND first (each word must match)
    let query = applyImageFilter(sb.from('recalls').select('*'));
    for (const w of words) {
      query = query.or(`product_nm.ilike.%${w}%,makr.ilike.%${w}%,bsnm_nm.ilike.%${w}%`);
    }
    let { data, error } = await query.order('recall_reg_dt', { ascending: false, nullsFirst: false }).limit(100);
    if (!error && data && data.length > 0) return data.map(toClient);

    // Fallback to OR (any word matches)
    if (words.length > 1) {
      const orConditions = words.map(w => `product_nm.ilike.%${w}%,makr.ilike.%${w}%,bsnm_nm.ilike.%${w}%`).join(',');
      query = applyImageFilter(sb.from('recalls').select('*')).or(orConditions);
      const result = await query.order('recall_reg_dt', { ascending: false, nullsFirst: false }).limit(100);
      if (!result.error && result.data && result.data.length > 0) return result.data.map(toClient);
    }

    return null;
  } catch { return null; }
}

async function upsertRecall(row: any) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('recalls').upsert(row, { onConflict: 'recall_sn' });
  if (error) console.error('[Upsert error]', error.message);
}

const RISK_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: '화재', keywords: ['화재', '발화', '불', '점화', '과열', '발열', '폭발'] },
  { tag: '감전', keywords: ['감전', '누전', '누액', '전류', '절연'] },
  { tag: '질식', keywords: ['질식', '기도', '흡입', '삼킴', '목'] },
  { tag: '유해물질', keywords: ['유해', '중금속', '납', '카드뮴', '프탈레이트', 'BPA', '환경호르몬', '발암', '독성', '화학'] },
  { tag: '화상', keywords: ['화상', '열상', '온도'] },
  { tag: '불량', keywords: ['부상', '절단', '베임', '찔림', '파손', '균열', '불량', '고장', '오작동'] },
  { tag: '알레르기', keywords: ['알레르기', '아토피', '피부', '발진', '가려움'] },
  { tag: '질병', keywords: ['질병', '감염', '세균', '곰팡이', '식중독', '살모넬라'] },
];

function extractRiskTags(shrtcomCn: string, productNm: string): string[] {
  const text = `${shrtcomCn || ''} ${productNm || ''}`.toLowerCase();
  return RISK_KEYWORDS.filter(r => r.keywords.some(kw => text.includes(kw.toLowerCase()))).map(r => r.tag);
}

async function queryDBRelated(recallSn: string) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: source } = await sb.from('recalls').select('*').eq('recall_sn', recallSn).single();
    if (!source) return null;

    const category = source.category;
    const sourceRiskTags = extractRiskTags(source.shrtcom_cn, source.product_nm);

    const { data: candidates } = await applyImageFilter(
      sb.from('recalls').select('*').eq('category', category).neq('recall_sn', recallSn)
    ).order('recall_reg_dt', { ascending: false, nullsFirst: false }).limit(50);

    if (!candidates || candidates.length === 0) return null;

    const scored = candidates.map((c: any) => {
      const tags = extractRiskTags(c.shrtcom_cn, c.product_nm);
      const overlap = tags.filter(t => sourceRiskTags.includes(t)).length;
      return { item: c, tags, score: overlap };
    });

    scored.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.item.recall_reg_dt || '') > (a.item.recall_reg_dt || '') ? 1 : -1;
    });

    return scored.slice(0, 5).map((s: any) => ({ ...toClient(s.item), riskTags: s.tags }));
  } catch { return null; }
}

export default async function handler(req: any, res: any) {
  try {
    const { q, category, recent, related } = req.query || {};

    // Related recalls
    if (related) {
      const fromDb = await queryDBRelated(related);
      if (fromDb) return res.json({ items: fromDb, source: 'db' });
      return res.json({ items: [], source: 'db' });
    }

    // Category browse: DB → Consumer24 fallback
    if (category) {
      const fromDb = await queryDBCategory(category);
      if (fromDb) return res.json({ items: fromDb, source: 'db' });
      const raw = await fetchFromConsumer('');
      let rows = raw.map(toRow).filter(r => r.category === category && hasImage(r));
      Promise.all(rows.map(upsertRecall)).catch(() => {});
      return res.json({ items: rows.map(toClient), source: 'consumer24' });
    }

    // Recent recalls: DB → Consumer24 fallback
    if (recent === 'true') {
      const fromDb = await queryDBRecent();
      if (fromDb) return res.json({ items: fromDb, source: 'db' });
      const raw = await fetchFromConsumer('');
      let rows = raw.map(toRow).filter(hasImage);
      Promise.all(rows.map(upsertRecall)).catch(() => {});
      return res.json({ items: rows.map(toClient), source: 'consumer24' });
    }

    // Keyword search: DB → Consumer24 fallback
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter (q, category, or recent)' });
    }

    const fromDb = await queryDBSearch(q);
    if (fromDb) return res.json({ items: fromDb, source: 'db' });

    const raw = await fetchFromConsumer(q);
    let rows = raw.map(toRow).filter(hasImage);
    Promise.all(rows.map(upsertRecall)).catch(() => {});
    return res.json({ items: rows.map(toClient), source: 'consumer24' });
  } catch (err: any) {
    console.error('[Recalls API]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
