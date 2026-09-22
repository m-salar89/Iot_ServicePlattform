export type ProgParam = {
  slot: number
  code: number
  value: number
  unit: number | null
  label: string
  display: string
}

export type ProgramInfo = {
  name: string | null
  params: ProgParam[]
}

const UNIT_CELSIUS = 151
const UNIT_TIME_SECONDS = 252

const PARAM_BY_CODE: Record<number, string> = {
  135: 'Vakuum',
  120: 'Starttemperatur',
  122: 'Vortrockenzeit',
  123: 'schliesszeit',
  162: 'Endtemperatur',
}

const PARAM_BY_SLOT: Record<number, string> = {
  0: 'Vakuum',
  1: 'Starttemperatur',
  2: 'Vortrockenzeit',
  3: 'schliesszeit',
  7: 'Endtemperatur',
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 1000) / 1000)
}

export function formatElapsedSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const rest = String(total % 60).padStart(2, '0')
  const hours = Math.floor(total / 3600)
  return hours > 0 ? `${hours}:${minutes}:${rest}` : `${minutes}:${rest}`
}

export function formatProgValue(value: number, unit: number | null): string {
  if (unit === UNIT_CELSIUS) return `${formatNumber(value)} °C`
  if (unit === UNIT_TIME_SECONDS) return formatElapsedSeconds(value)
  return formatNumber(value)
}

function paramLabel(code: number, slot: number): string {
  return PARAM_BY_CODE[code] ?? PARAM_BY_SLOT[slot] ?? `Parameter ${slot}`
}

export function parseProgInfo(raw: unknown): ProgramInfo | null {
  const record = asRecord(raw)
  if (!record) return null

  const name = typeof record.PNT === 'string' && record.PNT.trim() ? record.PNT.trim() : null
  const params: ProgParam[] = []

  for (const [key, value] of Object.entries(record)) {
    const match = /^E(\d+)$/.exec(key)
    if (!match) continue

    const slot = Number(match[1])
    const code = toNumber(value)
    const amount = toNumber(record[`V${slot}`])
    if (code === null || amount === null) continue

    const unit = toNumber(record[`U${slot}`])
    params.push({
      slot,
      code,
      value: amount,
      unit,
      label: paramLabel(code, slot),
      display: formatProgValue(amount, unit),
    })
  }

  params.sort((a, b) => a.slot - b.slot)
  if (!name && params.length === 0) return null
  return { name, params }
}
