import type { RecallItem } from '../api/consumerRecall'

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: '유아동', keywords: ['아기', '유아', '신생아', '베이비', '젖병', '이유식', '기저귀', '물티슈', '장난감', '딸랑이', '치발기', '아동', '어린이', '키즈', '둘리'] },
  { category: '완구류', keywords: ['장난감', '인형', '블록', '로봇', '자동차', '레고', '보드게임', '퍼즐', '물놀이', '공', 'RC', '드론', '프라모델'] },
  { category: '식품류', keywords: ['젤리', '사탕', '초콜릿', '과자', '캔디', '음료', '식품', '영양제', '건강', '비스킷', '쿠키', '시리얼', '소스', '조미료', '김치', '냉동', '가공'] },
  { category: '전자제품', keywords: ['배터리', '충전기', '케이블', '어댑터', '전기', '전자', 'LED', '램프', '조명', '선풍기', '히터', '난로', '가습기', '공기청정기', '드라이기', '면도기', '전기장판', '온수기', '전자레인지', '믹서기', '블렌더'] },
  { category: '화장품', keywords: ['화장품', '로션', '크림', '에센스', '선크림', '자외선', '립', '아이섀도', '파운데이션', '비비', '마스카라', '향수', '바디', '샴푸', '린스', '비누', '클렌징', '마스크팩', '토너'] },
  { category: '의류', keywords: ['의류', '옷', '신발', '운동화', '샌들', '슬리퍼', '부츠', '자켓', '코트', '점퍼', '티셔츠', '바지', '치마', '원피스', '잠옷', '속옷', '양말', '모자', '벨트', '가방'] },
  { category: '생활용품', keywords: ['생활', '주방', '수납', '정리', '청소', '세제', '빨래', '건조', '다리미', '보관', '용기', '텀블러', '물병', '도시락'] },
  { category: '욕실용품', keywords: ['욕실', '샤워', '샤워기', '수건', '칫솔', '치약', '구강', '면도', '욕조', '변기', '세면대', '비데'] },
  { category: '주방용품', keywords: ['냄비', '프라이팬', '칼', '도마', '그릇', '접시', '컵', '머그', '주전자', '커피', '티포트', '밥솥', '토스트', '에어프라이어'] },
  { category: '반려동물용품', keywords: ['반려동물', '강아지', '고양이', '펫', '애완', '사료', '간식', '목줄', '이동장', '배변', '장난감', '급식기'] },
]

const RISK_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: '화재', keywords: ['화재', '발화', '불', '점화', '과열', '발열', '폭발'] },
  { tag: '감전', keywords: ['감전', '누전', '누액', '전류', '절연'] },
  { tag: '질식', keywords: ['질식', '기도', '흡입', '삼킴', '목'] },
  { tag: '유해물질', keywords: ['유해', '중금속', '납', '카드뮴', '프탈레이트', 'BPA', '환경호르몬', '발암', '독성', '화학'] },
  { tag: '화상', keywords: ['화상', '열상', '온도'] },
  { tag: '부상', keywords: ['부상', '절단', '베임', '찔림', '파손', '균열'] },
  { tag: '알레르기', keywords: ['알레르기', '아토피', '피부', '발진', '가려움'] },
  { tag: '질병', keywords: ['질병', '감염', '세균', '곰팡이', '식중독', '살모넬라'] },
]

const COUNTRY_KEYWORDS: { country: string; keywords: string[] }[] = [
  { country: '중국', keywords: ['중국', 'CHINA', 'China', 'chn'] },
  { country: '일본', keywords: ['일본', 'JAPAN', 'Japan', 'jpn'] },
  { country: '미국', keywords: ['미국', 'USA', 'America'] },
  { country: '유럽', keywords: ['유럽', 'EU', 'Europe', '독일', '프랑스', '영국', '이탈리아'] },
  { country: '동남아', keywords: ['베트남', '인도네시아', '필리핀', '태국', '말레이시아'] },
]

export function classifyCategory(item: RecallItem): string {
  const text = `${item.productNm} ${item.shrtcomCn} ${item.modlNmInfo}`.toLowerCase()
  let best: { category: string; score: number } = { category: '기타', score: 0 }
  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.filter(kw => text.includes(kw.toLowerCase())).length
    if (score > best.score) best = { category: rule.category, score }
  }
  return best.category
}

export function extractRiskTags(item: RecallItem): string[] {
  const text = `${item.shrtcomCn} ${item.injryCauseResult} ${item.productNm}`.toLowerCase()
  return RISK_KEYWORDS.filter(r => r.keywords.some(kw => text.includes(kw.toLowerCase()))).map(r => r.tag)
}

export function extractCountry(item: RecallItem): string {
  const text = `${item.aditfield13} ${item.makr} ${item.mainSleoffic}`.toLowerCase()
  for (const c of COUNTRY_KEYWORDS) {
    if (c.keywords.some(kw => text.includes(kw.toLowerCase()))) return c.country
  }
  return ''
}

export const CATEGORIES = CATEGORY_RULES.map(r => r.category)

export function buildRecallWithMeta(item: RecallItem) {
  return {
    ...item,
    category: classifyCategory(item),
    riskTags: extractRiskTags(item),
    country: extractCountry(item),
  }
}

export type RecallWithMeta = ReturnType<typeof buildRecallWithMeta>
