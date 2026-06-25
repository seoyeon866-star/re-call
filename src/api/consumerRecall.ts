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
}

export function getRecallImages(item: RecallItem): string[] {
  if (!item.recallImgUrls) return []
  return item.recallImgUrls.split(',').map(s => s.trim()).filter(Boolean)
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
