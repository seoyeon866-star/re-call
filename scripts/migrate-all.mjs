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

const CATEGORY_RULES = [
  { category: '키즈', keywords: ['유아', '신생아', '아기', '베이비', '이유식', '유모차', '젖병', '턱받이', '아동', '키즈', '분유', '기저귀', '물티슈', '어린이', '돌보기', '교육', '완구', '장난감', '인형', '블록', '레고', '피규어', '퍼즐', '보드게임', '물놀이', '공', '드론', 'RC', '로봇', '자동차', '비행기', '물총', '놀이', '게임', '큐브', '미니카', '작동', '딸랑이', '치발기', '보행기', '아가'] },
  { category: '뷰티헬스', keywords: ['화장품', '크림', '로션', '향수', '립스틱', '마스크팩', '에센스', '선크림', '자외선', '바디', '샴푸', '클렌징', '화장', '메이크업', '아이섀도', '파운데이션', '비비', '마스카라', '립', '토너', '미스트', '세럼', '팩', '스킨케어', '기초', '헤어', '뷰티', '헬스', '마사지', '네일'] },
  { category: '생활용품', keywords: ['세제', '방향제', '탈취제', '청소용품', '생활', '수납', '정리', '다리미', '빨래', '건조', '보관', '용기', '텀블러', '물병', '도시락', '청소', '먼지', '살균', '소독', '물티슈', '행주', '수세미', '욕실', '샤워', '샤워기', '비누', '칫솔', '치약', '수건', '욕조', '변기', '세면대', '비데', '구강', '면도', '바스', '타월', '핸드워시', '바디워시', '가구', '의자', '테이블', '선반'] },
  { category: '의류', keywords: ['의류', '옷', '점퍼', '티셔츠', '바지', '신발', '자켓', '코트', '운동화', '샌들', '슬리퍼', '부츠', '치마', '원피스', '잠옷', '속옷', '양말', '모자', '벨트', '가방', '패딩', '조끼', '청바지', '후드', '맨투맨', '니트', '스웨터', '재킷', '블라우스', '셔츠', '트레이닝', '레깅스'] },
  { category: '식품키친', keywords: ['식품', '과자', '음료', '분유', '건강식품', '젤리', '사탕', '초콜릿', '캔디', '비스킷', '쿠키', '시리얼', '소스', '조미료', '김치', '냉동', '가공', '영양제', '건강', '음식', '간식', '차', '주스', '우유', '요구르트', '빵', '떡', '면', '라면', '통조림', '주방', '냄비', '프라이팬', '그릇', '컵', '머그', '칼', '도마', '주전자', '에어프라이어', '밥솥', '토스트', '커피', '티포트', '식기', '접시', '조리', '쿠커', '후라이팬', '찜기', '믹서', '튀김', '전자레인지', '인덕션'] },
  { category: '차량용품', keywords: ['car', 'vehicle', 'auto', 'bicycle', 'bike', 'motorcycle', 'scooter', '타이어', '차량', '자동차', '오토바이', '바이크', '헬멧', 'helmet', 'life jacket', 'life vest', 'buoyancy', '구명', 'motor', 'engine', 'electric bicycle', 'e-bike', '킥보드', '카시트', 'carseat', 'harness', 'climbing', '등반'] },
  { category: '반려동물', keywords: ['반려동물', '강아지', '고양이', '사료', '간식', '펫', '애완', '배변', '동물', '개', '캣', '묘', '견', '목줄', '이동장', '급식기', '장난감', '하네스', '리드줄', '켄넬', '쿠션', '방석', '스크래쳐', '모래', '화장실', '물그릇', '식기', '영양제', '훈련', '치석', '브러쉬', '가위', '패드'] },
  { category: '가전디지털', keywords: ['보조배터리', '충전기', '배터리', '전원', 'USB', '케이블', '이어폰', '헤드폰', '어댑터', '전기', 'LED', '램프', '조명', '선풍기', '히터', '가습기', '공기청정기', '드라이기', '면도기', '전기장판', '온수기', '전자레인지', '믹서기', '블렌더', '전자', '충전', '파워뱅크', '배터리팩', '스피커', '마우스', '키보드', '모니터', '노트북', '스마트폰', '태블릿', 'power bank', 'smartwatch', 'wireless'] },
];

function classifyCategory(productNm, shrtcomCn, modlNmInfo) {
  const text = `${productNm} ${shrtcomCn} ${modlNmInfo}`.toLowerCase();
  let best = { category: '기타', score: 0 };
  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (score > best.score) best = { category: rule.category, score };
  }
  return best.category;
}

function toRow(raw) {
  const productNm = raw.productNm || '';
  const shrtcomCn = raw.shrtcomCn || '';
  const modlNmInfo = raw.modlNmInfo || '';
  const category = classifyCategory(productNm, shrtcomCn, modlNmInfo);
  return {
    recall_sn: raw.recallSn || '',
    cntnts_id: raw.cntntsId || '',
    product_nm: productNm,
    makr: raw.makr || '',
    bsnm_nm: raw.bsnmNm || '',
    modl_nm_info: modlNmInfo,
    shrtcom_cn: shrtcomCn,
    recall_se: raw.recallSe || '',
    hrmfl_grad: raw.hrmflGrad || '',
    main_sleoffic: raw.mainSleoffic || '',
    recall_img_urls: raw.recallImgUrls || '',
    injry_cause_result: raw.injryCauseResult || '',
    cnsmr_ghvr_tips: raw.cnsmrGhvrTips || '',
    aditfield13: raw.aditfield13 || '',
    recall_reg_dt: raw.recallRegDt || '',
    category,
  };
}

async function fetchPage(keyword, pageNo, cntPerPage = 100) {
  const url = new URL('https://www.consumer.go.kr/openapi/recall/contents/index.do');
  url.searchParams.set('serviceKey', process.env.CONSUMER24_SERVICE_KEY);
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('cntPerPage', String(cntPerPage));
  url.searchParams.set('cntntsId', '0501');
  url.searchParams.set('productNm', keyword);
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
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const sb = createClient(supabaseUrl, supabaseKey);

  const first = await fetchPage('', 1);
  const total = first.total;
  const totalPages = Math.ceil(total / 100);
  console.log(`Total items from Consumer24: ${total}, pages: ${totalPages}`);

  const { count: existingCount, error: countError } = await sb
    .from('recalls')
    .select('*', { count: 'exact', head: true });
  if (!countError) {
    console.log(`Existing DB records: ${existingCount}`);
  }

  let inserted = 0;
  let errors = 0;
  const CONCURRENCY = 5;

  for (let startPage = 1; startPage <= totalPages; startPage += CONCURRENCY) {
    const endPage = Math.min(startPage + CONCURRENCY - 1, totalPages);
    const pageNumbers = [];
    for (let p = startPage; p <= endPage; p++) pageNumbers.push(p);

    const results = await Promise.allSettled(
      pageNumbers.map(p => fetchPage('', p).then(r => ({ page: p, ...r })))
    );

    const allRows = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allRows.push(...result.value.items.map(toRow));
      } else {
        console.error(`Page fetch error:`, result.reason);
        errors++;
      }
    }

    if (allRows.length > 0) {
      const { error } = await sb.from('recalls').upsert(allRows, { onConflict: 'recall_sn' });
      if (error) {
        console.error(`Upsert error pages ${startPage}-${endPage}:`, error.message);
        errors++;
      } else {
        inserted += allRows.length;
      }
    }

    if (startPage % (CONCURRENCY * 20) === 0 || endPage >= totalPages) {
      const pct = Math.min(100, Math.round((endPage / totalPages) * 100));
      console.log(`${pct}% | pages ${endPage}/${totalPages} | ${inserted} items upserted${errors ? `, ${errors} errors` : ''}`);
    }
  }

  const { count, error: finalError } = await sb
    .from('recalls')
    .select('*', { count: 'exact', head: true });
  console.log(`\nDone! DB total: ${finalError ? 'unknown' : count} records`);
  console.log(`Upserted this run: ${inserted}, Errors: ${errors}`);
}

main().catch(console.error);
