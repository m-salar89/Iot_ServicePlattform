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
  programType: number | null
  programTypeLabel: string | null
  params: ProgParam[]
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

const PARAM_BY_CODE: Record<number, string> = {
  135: 'Vakuum',
  120: 'Starttemperatur',
  122: 'Vortrocknen',
  123: 'Schlusszeit',
  124: 'Homogenisieren',
  125: 'Homogenisierzeit',
  158: 'Heizrate',
  162: 'Endtemperatur',
  163: 'Haltezeit',
  255: 'Tempertemperatur',
  256: 'Temperzeit',
  134: 'maximale Temperatur',
  159: 'Öffnungszeit',
}

const VALUE_BY_CODE: Record<number, string> = {
  4: 'Leer',
  115: 'Ja',
  116: 'Nein',
}

const UNIT_CELSIUS = 151
const UNIT_CELSIUS_PER_MIN = 249
const UNIT_TIME_SECONDS = 252

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

export function formatProgValue(value: number, unit: number | null): string {
  if (unit === UNIT_CELSIUS) return formatNumber(value) + ' \u00b0C'
  if (unit === UNIT_CELSIUS_PER_MIN) return formatNumber(value) + ' \u00b0C/min'
  if (unit === UNIT_TIME_SECONDS) return formatElapsedSeconds(value)
  if (unit === null && VALUE_BY_CODE[value]) return VALUE_BY_CODE[value]
  return formatNumber(value)
}

function paramLabel(code: number): string {
  const normalized = Math.trunc(code)
  return PARAM_BY_CODE[normalized] ?? 'Code ' + normalized
}

export function parseProgInfo(raw: unknown): ProgramInfo | null {
  const record = asRecord(raw)
  if (!record) return null

  const name = typeof record.PNT === 'string' && record.PNT.trim() ? record.PNT.trim() : null
  const programType = toNumber(record.PT ?? record.programType)
  const params: ProgParam[] = []

  for (const [key, value] of Object.entries(record)) {
    const match = /^E(\d+)$/.exec(key)
    if (!match) continue

    const slot = Number(match[1])
    const code = toNumber(value)
    const amount = toNumber(record['V' + slot] ?? record['v' + slot])
    if (code === null || amount === null) continue

    const unit = toNumber(record['U' + slot] ?? record['u' + slot])
    params.push({
      slot,
      code,
      value: amount,
      unit,
      label: paramLabel(code),
      display: formatProgValue(amount, unit),
    })
  }

  params.sort((a, b) => a.slot - b.slot)
  if (!name && params.length === 0 && programType === null) return null
  return {
    name,
    programType,
    programTypeLabel: programType === null ? null : programTypeLabel(programType),
    params,
  }
}
