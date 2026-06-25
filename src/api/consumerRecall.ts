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
}

export function getRecallImages(item: RecallItem): string[] {
  if (!item.recallImgUrls) return []
  return item.recallImgUrls.split(',').map(s => s.trim()).filter(Boolean)
}

function extractItems(raw: Record<string, unknown>): RecallItem[] {
  if (!raw) return []

  const dig = (obj: Record<string, unknown>, ...keys: string[]): unknown => {
    let cur: unknown = obj
    for (const k of keys) {
      if (!cur || typeof cur !== 'object') return undefined
      cur = (cur as Record<string, unknown>)[k]
    }
    return cur
  }

  const tryGet = (...path: string[]): RecallItem[] | undefined => {
    const val = dig(raw, ...path)
    if (!val) return undefined
    return Array.isArray(val) ? (val as RecallItem[]) : [val as RecallItem]
  }

  return (
    tryGet('selectCntntsForOpenAPIResponse', 'channel', 'return', 'content') ??
    tryGet('selectCntntsForOpenAPIResponse', 'return', 'content') ??
    tryGet('channel', 'return', 'content') ??
    tryGet('return', 'content') ??
    tryGet('content') ??
    []
  )
}

export async function searchRecalls(keyword: string): Promise<RecallItem[]> {
  const { data } = await axios.get('/api/recall', {
    params: { keyword },
  })
  return extractItems(data as Record<string, unknown>)
}

export async function fetchRecentRecalls(): Promise<RecallItem[]> {
  const { data } = await axios.get('/api/recent-recalls')
  return extractItems(data as Record<string, unknown>)
}
