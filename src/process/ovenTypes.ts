export const OVEN_TYPE_BY_ID: Record<number, string> = {
  0: 'OVEN_TYPE_NONE',
  1: 'OVEN_TYPE_E',
  2: 'OVEN_TYPE_EZR',
  3: 'OVEN_TYPE_FREE',
  4: 'OVEN_TYPE_V230',
  5: 'OVEN_TYPE_V230_ZR',
  6: 'OVEN_TYPE_V230_FREE',
  7: 'OVEN_TYPE_S430',
  8: 'OVEN_TYPE_NOVA_STUDIO',
  9: 'OVEN_TYPE_NOVA_LAB',
  10: 'OVEN_TYPE_NOVA_INDUSTRY',
  11: 'OVEN_TYPE_NOVA_STUDIO_ASP',
  12: 'OVEN_TYPE_NOVA_LAB_ASP',
  13: 'OVEN_TYPE_NOVA_INDUSTRY_ASP',
}

export function ovenTypeKey(dType: number): string | null {
  return OVEN_TYPE_BY_ID[dType] ?? null
}

export function ovenTypeLabel(dType: number): string {
  const key = ovenTypeKey(dType)
  if (!key) return `Typ ${dType}`
  return key.replace(/^OVEN_TYPE_/, '').replace(/_/g, ' ')
}
