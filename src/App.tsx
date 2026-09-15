import { useEffect, useState } from 'react'
import {
  getDevicesByEmail,
  getProcessesBySerialNumber,
  isProcessApiConfigured,
  type DeviceListResponse,
  type ProcessResponse,
} from './api/processes'
import AuthScreen from './auth/AuthScreen'
import DataFilter, { type DataFilterValues } from './filter/DataFilter'
import { formatProcessDateTime } from './filter/formatProcessDateTime'
import ProcessChart from './process/ProcessChart'
import { buildProcessView } from './process/processView'
import {
  getSignedInUser,
  isCognitoConfigured,
  logoutAccount,
  type AuthUser,
} from './auth/cognito'
import './App.css'
import './auth/AuthScreen.css'

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const [deviceResult, setDeviceResult] = useState<DeviceListResponse | null>(null)
  const [selectedSerial, setSelectedSerial] = useState('')
  const [processResult, setProcessResult] = useState<ProcessResponse | null>(null)
  const [processError, setProcessError] = useState('')

  async function refreshUser() {
    const current = await getSignedInUser()
    setUser(current)
    setReady(true)
  }

  useEffect(() => {
    void refreshUser()
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await logoutAccount()
      setUser(null)
      setDeviceResult(null)
      setSelectedSerial('')
      setProcessResult(null)
      setProcessError('')
    } finally {
      setSigningOut(false)
    }
  }

  async function loadProcesses(serialNumber: string, userId?: string) {
    const result = await getProcessesBySerialNumber(serialNumber, userId)
    setSelectedSerial(result.serialNumber)
    setProcessResult(result)
  }

  async function handleApply(values: DataFilterValues) {
    setProcessError('')
    setProcessResult(null)
    setDeviceResult(null)
    setSelectedSerial('')
    setLoadingProcesses(true)
    try {
      if (values.serialNumber) {
        await loadProcesses(values.serialNumber)
        return
      }
      const result = await getDevicesByEmail(values.email)
      setDeviceResult(result)
    } catch (error) {
      setProcessError(error instanceof Error ? error.message : 'Die Datenabfrage ist fehlgeschlagen.')
    } finally {
      setLoadingProcesses(false)
    }
  }

  async function handleSelectDevice(serialNumber: string) {
    setProcessError('')
    setProcessResult(null)
    setLoadingProcesses(true)
    try {
      await loadProcesses(serialNumber, deviceResult?.userId)
    } catch (error) {
      setProcessError(error instanceof Error ? error.message : 'Die Datenabfrage ist fehlgeschlagen.')
    } finally {
      setLoadingProcesses(false)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="/zubler-logo.png" alt="Zubler Gerätebau GmbH" />
          <div>
            <h1>Zubler Service Plattform</h1>
            <p>{user ? (user.email ?? user.username) : 'Zubler Gerätebau GmbH'}</p>
          </div>
        </div>
        {user ? (
          <button type="button" className="btn ghost" onClick={() => void handleSignOut()} disabled={signingOut}>
            Abmelden
          </button>
        ) : (
          <div className="pill">
            <span className="dot" />
            System online
          </div>
        )}
      </header>

      <main>
        {!isCognitoConfigured && (
          <p className="config-warning">
            Cognito ist noch nicht konfiguriert. Bitte `.env.example` nach `.env` kopieren und User Pool ID sowie App-Client-ID eintragen.
          </p>
        )}
        {isCognitoConfigured && !isProcessApiConfigured && (
          <p className="config-warning">
            Die Prozess-API ist nicht konfiguriert. Bitte `VITE_PROCESS_API_URL` setzen.
          </p>
        )}

        {!ready ? (
          <section className="hero">
            <p className="kicker">Sitzung</p>
            <h2>Laden…</h2>
          </section>
        ) : user ? (
          <div className="filter-shell">
            <DataFilter onApply={handleApply} busy={loadingProcesses} />

            {processError && <p className="filter-error result-message">{processError}</p>}

            {deviceResult && (
              <section className="process-result" aria-live="polite">
                <h3>
                  {deviceResult.deviceCount === 1
                    ? '1 Gerät gefunden'
                    : `${deviceResult.deviceCount} Geräte gefunden`}
                </h3>
                <p>
                  E-Mail <strong>{deviceResult.email}</strong> · User-ID{' '}
                  <strong>{deviceResult.userId}</strong>
                </p>
                {deviceResult.devices.length === 0 ? (
                  <p>Dieser Benutzer hat noch keine Prozesse.</p>
                ) : (
                  <ul className="device-list">
                    {deviceResult.devices.map((device) => (
                      <li key={device.serialNumber}>
                        <button
                          type="button"
                          className={device.serialNumber === selectedSerial ? 'device-btn selected' : 'device-btn'}
                          onClick={() => void handleSelectDevice(device.serialNumber)}
                          disabled={loadingProcesses}
                        >
                          <strong>{device.serialNumber}</strong>
                          <span>Prozesse anzeigen</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {processResult && (
              <section className="process-result" aria-live="polite">
                <h3>{processResult.processCount} Prozesse gefunden</h3>
                {processResult.owners && processResult.owners.length > 1 ? (
                  <p>
                    Seriennummer <strong>{processResult.serialNumber}</strong> ·{' '}
                    <strong>{processResult.owners.length} Kunden</strong> mit diesem Gerät
                  </p>
                ) : (
                  <p>
                    Seriennummer <strong>{processResult.serialNumber}</strong> · User-ID{' '}
                    <strong>{processResult.userId ?? 'unbekannt'}</strong>
                    {processResult.email && (
                      <>
                        {' · '}
                        <strong>{processResult.email}</strong>
                      </>
                    )}
                  </p>
                )}
                {processResult.processes.length === 0 ? (
                  <p>Für diesen Ofen sind keine Prozesse vorhanden.</p>
                ) : (
                  <ul className="process-list">
                    {processResult.processes.map((process) => {
                      const startedAt = formatProcessDateTime(process)
                      const view = buildProcessView(process)
                      return (
                        <li key={process.key}>
                          <strong>{startedAt ?? process.id}</strong>
                          {startedAt && <span className="process-id">{process.id}</span>}
                          {(process.email || process.userId) && (
                            <span className="process-owner">
                              {process.email || 'E-Mail unbekannt'}
                              {process.userId && ` · ${process.userId}`}
                            </span>
                          )}
                          <code>{process.key}</code>
                          {view && <ProcessChart view={view} />}
                          {process.data !== undefined && (
                            <details>
                              <summary>Prozessdaten anzeigen</summary>
                              <pre>{JSON.stringify(process.data, null, 2)}</pre>
                            </details>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>
        ) : (
          <div className="auth-shell">
            <section className="auth-copy">
              <h2>Zugang nur nach Admin-Freigabe.</h2>
              <p>
                Registriere dich mit deiner E-Mail. Ein Admin wird dein Konto
                bestätigen. Erst danach ist die Anmeldung möglich.
              </p>
            </section>
            <AuthScreen onSignedIn={refreshUser} />
          </div>
        )}
      </main>

      <footer className="footer">Zubler Service Plattform · Zubler Gerätebau GmbH</footer>
    </div>
  )
}