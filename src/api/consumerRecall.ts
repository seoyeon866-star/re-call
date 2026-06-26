import axios from 'axios'

export interface RecallItem {
  recallSn: string
  cntntsId: string
  productNm: string
  makr: string
  bsnmNm: string
  modlNmInfo: string
  shrtcomCn: string
  recallSe: string
  hrmflGrad: string
  mainSleoffic: string
  recallImgUrls: string
  injryCauseResult: string
  cnsmrGhvrTips: string
  aditfield13: string
  recallRegDt?: string
  category?: string
  infoCreatUrl?: string
  agencyName?: string
}

export function getRecallImages(item: RecallItem): string[] {
  if (!item.recallImgUrls) return []
  return item.recallImgUrls.split(',').map(s => s.trim()).filter(Boolean)
}

const FALLBACK_MAP: Record<string, string> = {
  '키즈': '/assets/category/키즈·영유아.png',
  '뷰티·헬스': '/assets/category/뷰티·헬스.png',
  '생활용품': '/assets/category/생활용품.png',
  '의류': '/assets/category/의류.png',
  '식품·키친': '/assets/category/식품·키친.png',
  '차량용품': '/assets/category/차량용품.png',
  '반려동물': '/assets/category/반려동물.png',
  '가전·디지털': '/assets/category/가전·디지털.png',
}

export function handleImgError(e: React.SyntheticEvent<HTMLImageElement>, category?: string | null) {
  const el = e.currentTarget
  if (el.dataset.fallback) return
  el.dataset.fallback = '1'
  if (category && FALLBACK_MAP[category]) {
    el.src = FALLBACK_MAP[category]
  } else {
    el.src = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
    )
  }
  el.style.objectFit = 'contain'
  el.style.padding = '16px'
  el.style.background = '#f5f5f5'
}

export async function searchRecalls(keyword: string): Promise<RecallItem[]> {
  const { data } = await axios.get('/api/recalls', {
    params: { q: keyword },
  })
  return (data as any).items || []
}

export async function fetchByCategory(category: string): Promise<RecallItem[]> {
  const { data } = await axios.get('/api/recalls', {
    params: { category },
  })
  return (data as any).items || []
}

export async function fetchRecentRecalls(): Promise<RecallItem[]> {
  const { data } = await axios.get('/api/recalls', {
    params: { recent: 'true' },
  })
  return (data as any).items || []
}
