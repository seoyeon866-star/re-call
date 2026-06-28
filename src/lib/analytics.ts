const STORAGE_KEY = 'ut_events'

interface UtEvent {
  event_name: string
  event_data: Record<string, string | number>
  timestamp: string
}

export function logEvent(event_name: string, event_data: Record<string, string | number> = {}) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    stored.push({
      event_name,
      event_data,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
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
