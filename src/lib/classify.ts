import type { RecallItem } from '../api/consumerRecall'
import { CATEGORY_RULES } from '../config/categories'

const RISK_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: '화재', keywords: ['화재', '발화', '불', '점화', '과열', '발열', '폭발'] },
  { tag: '감전', keywords: ['감전', '누전', '누액', '전류', '절연'] },
  { tag: '질식', keywords: ['질식', '기도', '흡입', '삼킴', '목'] },
  { tag: '유해물질', keywords: ['유해', '중금속', '납', '카드뮴', '프탈레이트', 'BPA', '환경호르몬', '발암', '독성', '화학'] },
  { tag: '화상', keywords: ['화상', '열상', '온도'] },
  { tag: '불량', keywords: ['부상', '절단', '베임', '찔림', '파손', '균열', '불량', '고장', '오작동'] },
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
  const productNm = item.productNm || ''
  const shrtcomCn = item.shrtcomCn || ''
  const modlNmInfo = item.modlNmInfo || ''
  const text = `${productNm} ${shrtcomCn} ${modlNmInfo}`.toLowerCase()
  let best: { category: string; score: number } = { category: '기타', score: 0 }
  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.filter(kw => text.includes(kw.toLowerCase())).length
    if (score > best.score) best = { category: rule.category, score }
  }
  return best.category
}

export function extractRiskTags(item: RecallItem): string[] {
  const shrtcomCn = item.shrtcomCn || ''
  const injryCauseResult = item.injryCauseResult || ''
  const productNm = item.productNm || ''
  const text = `${shrtcomCn} ${injryCauseResult} ${productNm}`.toLowerCase()
  return RISK_KEYWORDS.filter(r => r.keywords.some(kw => text.includes(kw.toLowerCase()))).map(r => r.tag)
}

export function extractCountry(item: RecallItem): string {
  const aditfield13 = item.aditfield13 || ''
  const makr = item.makr || ''
  const mainSleoffic = item.mainSleoffic || ''
  const text = `${aditfield13} ${makr} ${mainSleoffic}`.toLowerCase()
  for (const c of COUNTRY_KEYWORDS) {
    if (c.keywords.some(kw => text.includes(kw.toLowerCase()))) return c.country
  }
  return ''
}

export function buildRecallWithMeta(item: RecallItem) {
  return {
    ...item,
    category: (item as any).category || classifyCategory(item),
    riskTags: extractRiskTags(item),
    country: extractCountry(item),
  }
}

export type RecallWithMeta = ReturnType<typeof buildRecallWithMeta>
