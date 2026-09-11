import { type FormEvent, useState } from 'react'
import { loginAccount, mapAuthError, registerAccount } from './cognito'
import './AuthScreen.css'

type Mode = 'login' | 'register' | 'pending'

type Props = {
  onSignedIn: () => Promise<void> | void
}

export default function AuthScreen({ onSignedIn }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [givenName, setGivenName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleRegister(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const registered = await registerAccount({
        email,
        password,
        givenName,
        familyName,
      })
      setPendingEmail(registered)
      setPassword('')
      setMode('pending')
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await loginAccount(email, password)
      await onSignedIn()
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'pending') {
    return (
      <section className="auth-panel">
        <p className="kicker">Registrierung</p>
        <h2>Warten auf Freigabe</h2>
        <p className="auth-lead">
          Das Konto für <strong>{pendingEmail}</strong> wurde angelegt. Ein Admin
          erhält eine E-Mail und gibt das Konto frei. Danach ist die Anmeldung möglich.
        </p>
        <button type="button" className="btn primary" onClick={() => setMode('login')}>
          Zur Anmeldung
        </button>
      </section>
    )
  }

  return (
    <section className="auth-panel">
      <p className="kicker">{mode === 'login' ? 'Anmeldung' : 'Konto erstellen'}</p>
      <h2>{mode === 'login' ? 'Willkommen zurück.' : 'Zugang beantragen.'}</h2>
      <p className="auth-lead">
        {mode === 'login'
          ? 'Melden Sie sich an, sobald Ihr Konto freigegeben wurde.'
          : 'Nach der Registrierung bestätigt ein Admin das Konto. Sie erhalten dann eine E-Mail.'}
      </p>

      <form className="auth-form" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
        {mode === 'register' && (
          <div className="auth-row">
            <label>
              Vorname
              <input value={givenName} onChange={(e) => setGivenName(e.target.value)} autoComplete="given-name" />
            </label>
            <label>
              Nachname
              <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} autoComplete="family-name" />
            </label>
          </div>
        )}

        <label>
          E-Mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label>
          Passwort
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
        </button>
      </form>

      <p className="auth-switch">
        {mode === 'login' ? (
          <>
            Noch kein Konto?{' '}
            <button type="button" className="link" onClick={() => { setMode('register'); setError('') }}>
              Registrieren
            </button>
          </>
        ) : (
          <>
            Bereits registriert?{' '}
            <button type="button" className="link" onClick={() => { setMode('login'); setError('') }}>
              Anmelden
            </button>
          </>
        )}
      </p>
    </section>
  )
}
