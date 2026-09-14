function toUnixSeconds(value: unknown): number | null {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) return null
    return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value)
  }

  const text = String(value).trim()
  if (!text) return null

  if (/^\d+$/.test(text)) {
    const n = Number(text)
    if (n <= 0) return null
    return n > 1_000_000_000_000 ? Math.floor(n / 1000) : n
  }

  const parsed = Date.parse(text)
  if (Number.isNaN(parsed)) return null
  return Math.floor(parsed / 1000)
}

function timestampFromProcessId(id: string): number | null {
  const match = /^(?:P_|ERR_)(\d+)/.exec(id)
  return match ? toUnixSeconds(match[1]) : null
}

function timestampFromPayload(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null
  const payload = data as Record<string, unknown>

  for (const key of ['sensordata', 'sensorData', 'SensorData']) {
    const block = payload[key]
    const rows = Array.isArray(block) ? block : block && typeof block === 'object' ? [block] : []
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue
      const item = row as Record<string, unknown>
      for (const field of ['Timestamp', 'timeStamp', 'tS', 'ts']) {
        const ts = toUnixSeconds(item[field])
        if (ts !== null) return ts
      }
    }
  }

  const events = payload.events
  if (Array.isArray(events)) {
    for (const event of events) {
      if (!event || typeof event !== 'object') continue
      const item = event as Record<string, unknown>
      for (const field of ['Timestamp', 'timeStamp', 'tS', 'ts']) {
        const ts = toUnixSeconds(item[field])
        if (ts !== null) return ts
      }
    }
  }

  for (const field of ['startTime', 'startedAt', 'timestamp', 'Timestamp']) {
    const ts = toUnixSeconds(payload[field])
    if (ts !== null) return ts
  }

  return null
}

export function formatProcessDateTime(id: string, data?: unknown): string | null {
  const seconds = timestampFromPayload(data) ?? timestampFromProcessId(id)
  if (seconds === null) return null

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(new Date(seconds * 1000))
}