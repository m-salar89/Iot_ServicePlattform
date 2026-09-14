import { getIdToken } from '../auth/cognito'

const processApiUrl = import.meta.env.VITE_PROCESS_API_URL?.trim()

export const isProcessApiConfigured = Boolean(processApiUrl)

export type ProcessEntry = {
  id: string
  key: string
  timestamp?: number | null
  lastModified?: string
  data?: unknown
  error?: string
}

export type ProcessResponse = {
  serialNumber: string
  userId: string
  prefix: string
  processCount: number
  processes: ProcessEntry[]
}

export type DeviceEntry = {
  serialNumber: string
}

export type DeviceListResponse = {
  email: string
  userId: string
  deviceCount: number
  devices: DeviceEntry[]
}

type ApiErrorBody = {
  error?: string
}

async function callProcessApi(params: Record<string, string>): Promise<unknown> {
  if (!processApiUrl) {
    throw new Error('Die Prozess-API ist nicht konfiguriert.')
  }

  const token = await getIdToken()
  const url = new URL(processApiUrl)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const rawBody = await response.text()
  let body: unknown

  try {
    body = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    throw new Error(`Die API hat eine ungültige Antwort geliefert (${response.status}).`)
  }

  if (!response.ok) {
    const apiError =
      body && typeof body === 'object' && 'error' in body ? String((body as ApiErrorBody).error) : undefined
    throw new Error(apiError || `Die Abfrage ist fehlgeschlagen (${response.status}).`)
  }

  return body
}

export async function getProcessesBySerialNumber(serialNumber: string): Promise<ProcessResponse> {
  return (await callProcessApi({ serialNumber: serialNumber.trim() })) as ProcessResponse
}

export async function getDevicesByEmail(email: string): Promise<DeviceListResponse> {
  return (await callProcessApi({ email: email.trim().toLowerCase() })) as DeviceListResponse
}