import { GUI_STRING_DE, GUI_STRING_NAME } from './guiStrings.de'

export type ProgParam = {
  slot: number
  code: number
  value: number | null
  unit: number | string | null
  label: string
  display: string
}

export type ProgField = {
  key: string
  label: string
  display: string
}

export type ProgramInfo = {
  name: string | null
  programType: number | null
  programTypeLabel: string | null
  params: ProgParam[]
  fields: ProgField[]
}

const PROGRAM_TYPE_BY_ID: Record<number, string> = {
  0: 'PROGRAM_TYPE_STANDARD',
  1: 'PROGRAM_TYPE_PROF',
  2: 'PROGRAM_TYPE_PROF_TTC',
  3: 'PROGRAM_TYPE_2_STEP',
  4: 'PROGRAM_TYPE_2_STEP_TTC',
  5: 'PROGRAM_TYPE_PRESS',
  6: 'PROGRAM_TYPE_I_PRESS',
  7: 'PROGRAM_TYPE_ADVANCED',
  40: 'PROGRAM_TYPE_SINTER',
  42: 'PROGRAM_TYPE_ASP',
  43: 'PROGRAM_TYPE_ASP_STUDIO',
  44: 'PROGRAM_TYPE_SINTER_POWER',
  45: 'PROGRAM_TYPE_SINTER_US',
  50: 'PROGRAM_TYPE_NOVA_STUDIO_SINTER',
  51: 'PROGRAM_TYPE_PROFS',
  52: 'PROGRAM_TYPE_2_STEPS',
  80: 'PROGRAM_TYPE_CALB_HEAT_TO_TEMP',
  81: 'PROGRAM_TYPE_STARTUP',
}

const CHOICE_NAMES = new Set(['YES', 'NO', 'ON', 'OFF'])
const TIME_UNITS = new Set(['mm:ss', 'mmss', 'hh:mm'])

const STRING_ID_BY_NAME: Record<string, number> = {}
for (const [id, name] of Object.entries(GUI_STRING_NAME)) {
  STRING_ID_BY_NAME[name] = Number(id)
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

function toUnit(value: unknown): number | string | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim()
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : trimmed
  }
  return null
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 1000) / 1000)
}

function guiText(id: number): string | null {
  const text = GUI_STRING_DE[Math.trunc(id)]
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  return trimmed || null
}

function impliedUnit(code: number): number | null {
  const name = GUI_STRING_NAME[Math.trunc(code)]
  if (!name) return null
  if (name.includes('HEAT_RATE') || name.endsWith('_RATE')) return STRING_ID_BY_NAME.UNIT_DEGREE_C_MIN ?? null
  if (name.includes('TEMP')) return STRING_ID_BY_NAME.UNIT_DEGREE_C ?? null
  if (name.includes('TIME') || name === 'DURATION') return STRING_ID_BY_NAME.UNIT_MIN_SEC ?? null
  if (name.includes('PERCENT')) return STRING_ID_BY_NAME.UNIT_PERCENT ?? null
  return null
}

export function programTypeLabel(programType: number): string {
  const key = PROGRAM_TYPE_BY_ID[programType]
  if (!key) return 'Typ ' + programType
  return key.replace(/^PROGRAM_TYPE_/, '').replace(/_/g, ' ')
}

export function formatElapsedSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const rest = String(total % 60).padStart(2, '0')
  const hours = Math.floor(total / 3600)
  return hours > 0 ? hours + ':' + minutes + ':' + rest : minutes + ':' + rest
}

export function formatProgValue(value: number, unit: number | string | null, code?: number): string {
  const resolved = typeof unit === 'number' ? unit : unit === null && code !== undefined ? impliedUnit(code) : null
  if (typeof resolved === 'number') {
    const unitText = guiText(resolved)
    if (unitText && TIME_UNITS.has(unitText)) return formatElapsedSeconds(value)
    if (unitText) return formatNumber(value) + ' ' + unitText
  }
  if (typeof unit === 'string') return formatNumber(value) + ' ' + unit
  if (unit === null || typeof unit === 'string') {
    const choice = GUI_STRING_NAME[Math.trunc(value)]
    if (choice && CHOICE_NAMES.has(choice)) {
      const text = guiText(value)
      if (text) return text
    }
  }
  return formatNumber(value)
}

function paramLabel(code: number): string {
  const normalized = Math.trunc(code)
  return guiText(normalized) ?? 'Code ' + normalized
}

function fieldLabel(key: string): string {
  if (key === 'PNB') return 'Programmname'
  if (key === 'PSL') return guiText(STRING_ID_BY_NAME.STEP_TIME_REMAINING ?? -1) ?? key
  if (key === 'CHZI') return 'Heizzone'
  return key
}

function fieldDisplay(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value.trim() || null
  const amount = toNumber(value)
  if (amount === null) return null
  if (key === 'PSL') return formatElapsedSeconds(amount)
  return formatNumber(amount)
}

function preferParam(current: ProgParam, next: ProgParam): ProgParam {
  if (current.unit === null && next.unit !== null) return next
  if (current.unit !== null && next.unit === null) return current
  return next.slot >= current.slot ? next : current
}

export function parseProgInfo(raw: unknown): ProgramInfo | null {
  const record = asRecord(raw)
  if (!record) return null

  const name = typeof record.PNT === 'string' && record.PNT.trim() ? record.PNT.trim() : null
  const programType = toNumber(record.PT ?? record.programType)
  const byCode = new Map<number, ProgParam>()

  for (const [key, value] of Object.entries(record)) {
    const match = /^E(\d+)$/i.exec(key)
    if (!match) continue

    const slot = Number(match[1])
    const code = toNumber(value)
    if (code === null) continue

    const amount = toNumber(record['V' + slot] ?? record['v' + slot])
    const unit = toUnit(record['U' + slot] ?? record['u' + slot])
    const next: ProgParam = {
      slot,
      code,
      value: amount,
      unit,
      label: paramLabel(code),
      display: amount === null ? '\u2013' : formatProgValue(amount, unit, code),
    }
    const current = byCode.get(Math.trunc(code))
    byCode.set(Math.trunc(code), current ? preferParam(current, next) : next)
  }

  const params = [...byCode.values()].sort((a, b) => a.slot - b.slot)
  const fields: ProgField[] = []
  for (const [key, value] of Object.entries(record)) {
    if (key === 'PNT' || key === 'PT' || key === 'programType' || /^[EVU]\d+$/i.test(key)) continue
    const display = fieldDisplay(key, value)
    if (!display || (key === 'PNB' && display === name)) continue
    fields.push({ key, label: fieldLabel(key), display })
  }

  if (!name && params.length === 0 && fields.length === 0 && programType === null) return null
  return {
    name,
    programType,
    programTypeLabel: programType === null ? null : programTypeLabel(programType),
    params,
    fields,
  }
}
