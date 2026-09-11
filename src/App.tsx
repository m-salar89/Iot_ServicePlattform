import { useEffect, useState } from 'react'
import AuthScreen from './auth/AuthScreen'
import {
  getSignedInUser,
  isCognitoConfigured,
  logoutAccount,
  type AuthUser,
} from './auth/cognito'
import './App.css'
import './auth/AuthScreen.css'

const upcoming = [
  {
    service: 'AWS Lambda',
    title: 'Backend-Funktionen',
    text: 'Später kommen API-Aufrufe und Geschäftslogik als serverless Functions dazu.',
  },
  {
    service: 'Amazon S3',
    title: 'Dateien und Assets',
    text: 'Gerätedaten, Bilder und Exporte lassen sich danach direkt im Object Storage ablegen.',
  },
  {
    service: 'Amazon DynamoDB',
    title: 'Geräte- und Messdaten',
    text: 'Persistente Tabellen für Geräte, Benutzer und Telemetrie folgen im nächsten Schritt.',
  },
]

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [signingOut, setSigningOut] = useState(false)

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
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <svg className="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#0b1c24" />
            <path d="M8 20.5c2.4-2.2 5.2-3.3 8-3.3s5.6 1.1 8 3.3" stroke="#2ec4b6" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 16.2c1.6-1.5 3.3-2.2 5-2.2s3.4.7 5 2.2" stroke="#2ec4b6" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="11.2" r="1.8" fill="#e8a317" />
          </svg>
          <div>
            <h1>IoT Service Plattform</h1>
            <p>{user ? user.email ?? user.username : 'Anmeldung über Amazon Cognito'}</p>
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
          <>
            <section className="hero">
              <p className="kicker">Angemeldet</p>
              <h2>Willkommen in der Plattform.</h2>
              <p className="hero-lead">
                Ihr Konto ist freigegeben. Als Nächstes können Lambda, S3 und DynamoDB
                angebunden werden.
              </p>
            </section>
            <section className="grid" aria-label="Geplante AWS-Services">
              {upcoming.map((item) => (
                <article className="card" key={item.service}>
                  <span>{item.service}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </section>
          </>
        ) : (
          <div className="auth-shell">
            <section className="auth-copy">
              <p className="kicker">WebApp · Cognito</p>
              <h2>Zugang nur nach Admin-Freigabe.</h2>
              <p>
                Registrieren Sie sich mit Ihrer E-Mail. Ein Admin erhält einen Link
                und bestätigt das Konto. Erst danach ist die Anmeldung möglich.
              </p>
            </section>
            <AuthScreen onSignedIn={refreshUser} />
          </div>
        )}
      </main>

      <footer className="footer">IoT Service Plattform · Cognito mit Admin-Freigabe</footer>
    </div>
  )
}
