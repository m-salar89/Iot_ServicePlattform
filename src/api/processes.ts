import { getIdToken } from '../auth/cognito'

const processApiUrl = import.meta.env.VITE_PROCESS_API_URL?.trim()

export const isProcessApiConfigured = Boolean(processApiUrl)

export type ProcessEntry = {
  id: string
  key: string
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

type ApiErrorBody = {
  error?: string
}

export async function getProcessesBySerialNumber(
  serialNumber: string,
): Promise<ProcessResponse> {
  if (!processApiUrl) {
    throw new Error('Die Prozess-API ist nicht konfiguriert.')
  }

  const token = await getIdToken()
  const url = new URL(processApiUrl)
  url.searchParams.set('serialNumber', serialNumber.trim())

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const rawBody = await response.text()
  let body: ProcessResponse | ApiErrorBody

  try {
    body = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    throw new Error(`Die API hat eine ungültige Antwort geliefert (${response.status}).`)
  }

  if (!response.ok) {
    const apiError = 'error' in body ? body.error : undefined
    throw new Error(apiError || `Die Abfrage ist fehlgeschlagen (${response.status}).`)
  }

  return body as ProcessResponse
}
 // test 