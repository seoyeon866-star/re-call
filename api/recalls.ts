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
  { category: '유아동', keywords: ['유아', '신생아', '아기', '베이비', '이유식', '유모차', '젖병', '턱받이', '아동', '키즈', '분유', '기저귀', '물티슈', '어린이', '돌보기', '교육', '완구', '장난감', '딸랑이', '치발기', '보행기', '캐리어', '아가'] },
  { category: '완구류', keywords: ['장난감', '인형', '블록', '레고', '피규어', '퍼즐', '보드게임', '물놀이', '공', '드론', 'RC', '로봇', '자동차', '비행기', '물총', '놀이', '게임', '큐브', '미니카', '작동'] },
  { category: '화장품', keywords: ['화장품', '크림', '로션', '향수', '립스틱', '마스크팩', '에센스', '선크림', '자외선', '바디', '샴푸', '클렌징', '화장', '메이크업', '아이섀도', '파운데이션', '비비', '마스카라', '립', '토너', '미스트', '세럼', '팩', '스킨케어', '기초'] },
  { category: '의류', keywords: ['의류', '옷', '점퍼', '티셔츠', '바지', '신발', '자켓', '코트', '운동화', '샌들', '슬리퍼', '부츠', '치마', '원피스', '잠옷', '속옷', '양말', '모자', '벨트', '가방', '패딩', '조끼', '청바지', '후드', '맨투맨', '니트', '스웨터', '재킷', '블라우스', '셔츠', '트레이닝', '레깅스'] },
  { category: '전자제품', keywords: ['보조배터리', '충전기', '배터리', '전원', 'USB', '케이블', '이어폰', '헤드폰', '어댑터', '전기', 'LED', '램프', '조명', '선풍기', '히터', '가습기', '공기청정기', '드라이기', '면도기', '전기장판', '온수기', '전자레인지', '믹서기', '블렌더', '전자', '충전', '어댑터', '파워뱅크', '배터리팩', '스피커', '마우스', '키보드', '모니터', '노트북'] },
  { category: '생활용품', keywords: ['세제', '방향제', '탈취제', '청소용품', '생활', '수납', '정리', '다리미', '빨래', '건조', '보관', '용기', '텀블러', '물병', '도시락', '청소', '먼지', '살균', '소독', '물티슈', '행주', '수세미'] },
  { category: '주방용품', keywords: ['주방', '냄비', '프라이팬', '그릇', '컵', '머그', '칼', '도마', '주전자', '에어프라이어', '밥솥', '토스트', '커피', '티포트', '식기', '접시', '조리', '쿠커', '후라이팬', '찜기', '믹서', '튀김'] },
  { category: '욕실용품', keywords: ['욕실', '샤워', '샤워기', '비누', '칫솔', '치약', '수건', '욕조', '변기', '세면대', '비데', '구강', '면도', '바스', '타월', '샤워볼', '핸드워시', '바디워시'] },
  { category: '식품류', keywords: ['식품', '과자', '음료', '분유', '건강식품', '젤리', '사탕', '초콜릿', '캔디', '비스킷', '쿠키', '시리얼', '소스', '조미료', '김치', '냉동', '가공', '영양제', '건강', '음식', '간식', '차', '주스', '우유', '요구르트', '빵', '떡', '면', '라면', '통조림'] },
  { category: '반려동물', keywords: ['반려동물', '강아지', '고양이', '사료', '간식', '펫', '애완', '배변', '동물', '개', '캣', '묘', '견', '목줄', '이동장', '급식기', '장난감', '하네스', '리드줄', '켄넬', '쿠션', '방석', '스크래쳐', '모래', '화장실', '물그릇', '식기', '영양제', '훈련', '치석', '브러쉬', '가위', '패드'] },
];

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

async function upsertRecall(row: any) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('recalls').upsert(row, { onConflict: 'recall_sn' });
  if (error) console.error('[Upsert error]', error.message);
}

async function queryFromDB(column: string, value: string) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('recalls')
      .select('*')
      .eq(column, value)
      .order('recall_reg_dt', { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) throw error;
    return data ? data.map(toClient) : [];
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const { q, category, recent } = req.query || {};

    // Category browse: try DB, fall back to broad Consumer24 fetch + classify
    if (category) {
      const fromDb = await queryFromDB('category', category);
      if (fromDb) return res.json({ items: fromDb, source: 'db' });
      const raw = await fetchFromConsumer('');
      const rows = raw.map(toRow).filter(r => r.category === category);
      Promise.all(rows.map(upsertRecall)).catch(() => {});
      return res.json({ items: rows.map(toClient), source: 'consumer24' });
    }

    // Recent recalls: try DB, fall back to Consumer24
    if (recent === 'true') {
      const fromDb = await queryFromDB('recall_sn', ''); // dummy — just check if DB is available
      if (fromDb) {
        const sb = getSupabase();
        if (sb) {
          const { data, error } = await sb
            .from('recalls')
            .select('*')
            .order('recall_reg_dt', { ascending: false, nullsFirst: false })
            .limit(100);
          if (!error && data && data.length > 0) {
            return res.json({ items: data.map(toClient), source: 'db' });
          }
        }
      }
      const raw = await fetchFromConsumer('');
      const rows = raw.map(toRow);
      Promise.all(rows.map(upsertRecall)).catch(() => {});
      return res.json({ items: rows.map(toClient), source: 'consumer24' });
    }

    // Keyword search: fetch from Consumer24, classify, upsert in background
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter (q, category, or recent)' });
    }

    const raw = await fetchFromConsumer(q);
    const rows = raw.map(toRow);
    Promise.all(rows.map(upsertRecall)).catch(() => {});
    return res.json({ items: rows.map(toClient), source: 'consumer24' });
  } catch (err: any) {
    console.error('[Recalls API]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
