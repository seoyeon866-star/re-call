const STORAGE_KEY = 'ut_events'

interface UtEvent {
  event_name: string
  event_data: Record<string, string | number>
  timestamp: string
}

export function logEvent(event_name: string, event_data: Record<string, string | number> = {}, extra?: Record<string, string | number>) {
  const payload = {
    event: event_name,
    ...event_data,
    ...extra,
  }
  try {
    // localStorage backup
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    stored.push({
      event_name,
      event_data,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {}
  // GTM dataLayer push
  try {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push(payload)
    }
  } catch {}

  // Check Task 1 completion: home_view → detail_view (라부부 COCA-COLA 시리즈 - 랜덤박스 장난감)
  if (event_name === 'detail_view' && event_data.productName === '스탠리 1913 스위치백 텀블러') {
    checkTask1Completion()
  }
}

function checkTask1Completion() {
  try {
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as UtEvent[]
    const homeEvent = events.find(e => e.event_name === 'home_view')
    const detailEvent = events.find(e => e.event_name === 'detail_view' && e.event_data.productName === '라부부 COCA-COLA 시리즈 - 랜덤박스 장난감')
    if (!homeEvent || !detailEvent) return
    const start = new Date(homeEvent.timestamp).getTime()
    const end = new Date(detailEvent.timestamp).getTime()
    const diffSec = ((end - start) / 1000).toFixed(1)
    const msg = `Task 1 Completion Time: ${diffSec} sec`
    console.log(msg)
    // Push to dataLayer
    try {
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({ event: 'task_complete', task: 1, completionTimeSec: parseFloat(diffSec), utVersion: '2' })
      }
    } catch {}
  } catch {}
}

export function getEvents(): UtEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function clearEvents() {
  localStorage.removeItem(STORAGE_KEY)
}

// Export to clipboard
export function copyEventsToClipboard() {
  const events = getEvents()
  const text = events.map(e =>
    `${e.timestamp}\t${e.event_name}\t${JSON.stringify(e.event_data)}`
  ).join('\n')
  const header = 'timestamp\tevent_name\tevent_data\n'
  navigator.clipboard.writeText(header + text).catch(() => {})
}

// Expose for console use
if (typeof window !== 'undefined') {
  ;(window as any).__ut = { getEvents, clearEvents, copyEventsToClipboard }
}
