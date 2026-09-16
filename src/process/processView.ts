import type { ProcessEntry } from '../api/processes'

export const SENSOR_KEYS = [
  'CT',
  'TT',
  'PCBAT',
  'PAT',
  'CTAD',
  'LP',
  'ULS',
  'DLS',
  'CVMm',
  'CVADC',
  'CPBar',
  'CPP',
  'PEP',
  'SHP',
] as const

export type SensorKey = (typeof SENSOR_KEYS)[number]
export type SensorValues = Record<SensorKey, number | null>

export type ChartPoint = {
  t: number
  elapsed: number
  temperature: number | null
  sensors: SensorValues
  error: boolean
  errorFlags: Record<string, string>
}

export type ProcessView = {
  programName: string | null
  deviceKind: string | null
  deviceSerial: string | null
  points: ChartPoint[]
  errors: ChartPoint[]
  droppedTimestamps: number
}

const DAY_IN_SECONDS = 86_400

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((row): row is Record<string, unknown> => asRecord(row) !== null)
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function toErrorFlags(value: unknown): Record<string, string> {
  const record = asRecord(value)
  if (!record) return {}

  const flags: Record<string, string> = {}
  for (const [key, raw] of Object.entries(record)) {
    // errorFlags enthaelt Geraete-Rohbytes, die als Text unlesbar sind.
    flags[key] = String(raw ?? '').replace(/[^\x20-\x7E]/g, '').trim()
  }
  return flags
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function pickSensors(row: Record<string, unknown>): SensorValues {
  const sensors = {} as SensorValues
  for (const key of SENSOR_KEYS) {
    sensors[key] = toNumber(row[key])
  }
  return sensors
}

export function formatErrorFlags(point: ChartPoint): string {
  const entries = Object.entries(point.errorFlags)
  if (entries.length === 0) return point.error ? 'Fehler' : ''
  return entries.map(([key, value]) => (value ? `${key}: ${value}` : key)).join(' · ')
}

export function formatSensorValue(value: number | null): string {
  if (value === null) return "-"
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 1000) / 1000)
}

export function buildProcessView(process: ProcessEntry): ProcessView | null {
  const payload = asRecord(process.data)
  if (!payload) return null

  const metadata = asRecord(payload.metadata) ?? {}
  const events = asRows(payload.events)
  const sensordata = asRows(payload.sensordata ?? payload.sensorData ?? payload.SensorData)
  const paired = Math.min(events.length, sensordata.length)
  if (paired === 0) return null

  const measured: ChartPoint[] = []
  for (let index = 0; index < paired; index += 1) {
    const event = events[index]
    const t = toNumber(event.tS ?? event.ts ?? event.Timestamp)
    if (t === null) continue

    const sensors = pickSensors(sensordata[index])
    measured.push({
      t,
      elapsed: 0,
      temperature: sensors.CT,
      sensors,
      error: event.Error === true,
      errorFlags: toErrorFlags(event.errorFlags),
    })
  }
  if (measured.length === 0) return null

  // Einzelne Geraete senden Zeitstempel aus einem falsch gestellten Uhrenstand,
  // die die Zeitachse sonst um Jahre aufspannen.
  const reference = median(measured.map((point) => point.t))
  const plausible = measured.filter((point) => Math.abs(point.t - reference) <= DAY_IN_SECONDS)
  const usable = plausible.length > 0 ? plausible : measured

  const sorted = [...usable].sort((a, b) => a.t - b.t)
  const start = sorted[0].t
  const points = sorted.map((point) => ({ ...point, elapsed: point.t - start }))

  const serial = metadata.dSN
  return {
    programName: pickString(metadata, ['programName', 'progName', 'pName']),
    deviceKind: pickString(metadata, ['dKind']),
    deviceSerial: serial === null || serial === undefined ? null : String(serial),
    points,
    errors: points.filter((point) => point.error),
    droppedTimestamps: measured.length - usable.length,
  }
}

export function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const rest = String(total % 60).padStart(2, '0')
  const hours = Math.floor(total / 3600)
  return hours > 0 ? `${hours}:${minutes}:${rest}` : `${minutes}:${rest}`
}
