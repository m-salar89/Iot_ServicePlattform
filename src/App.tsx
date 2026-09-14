import { useEffect, useState } from 'react'
import AuthScreen from './auth/AuthScreen'
import DataFilter, { type DataFilterValues } from './filter/DataFilter'
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
  const [appliedFilter, setAppliedFilter] = useState<DataFilterValues | null>(null)

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
      setAppliedFilter(null)
    } finally {
      setSigningOut(false)
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

        {!ready ? (
          <section className="hero">
            <p className="kicker">Sitzung</p>
            <h2>Laden…</h2>
          </section>
        ) : user ? (
          <div className="filter-shell">
            <DataFilter onApply={setAppliedFilter} />
            {appliedFilter && (
              <p className="filter-result">
                Filter gesetzt
                {appliedFilter.email ? (
                  <>
                    {' '}für E-Mail <strong>{appliedFilter.email}</strong>
                  </>
                ) : null}
                {appliedFilter.serialNumber ? (
                  <>
                    {appliedFilter.email ? ' und' : ' für'} Seriennummer{' '}
                    <strong>{appliedFilter.serialNumber}</strong>
                  </>
                ) : null}
                . Die Datenabfrage folgt, sobald das Backend angebunden ist.
              </p>
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
