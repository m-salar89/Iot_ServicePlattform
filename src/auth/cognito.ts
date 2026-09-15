import { Amplify } from 'aws-amplify'
import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth'

// Mitarbeiter-Pool der Service-Plattform. Der Kunden-Pool wird hier nie verwendet,
// den kennt nur die Lambda (CUSTOMER_USER_POOL_ID) fuer die Prozess-Suche.
const userPoolId = import.meta.env.VITE_STAFF_USER_POOL_ID
const userPoolClientId = import.meta.env.VITE_STAFF_COGNITO_CLIENT_ID

export const isCognitoConfigured = Boolean(userPoolId && userPoolClientId)

if (isCognitoConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
      },
    },
  })
}

export type AuthUser = {
  username: string
  email?: string
}

export async function getSignedInUser(): Promise<AuthUser | null> {
  if (!isCognitoConfigured) return null

  try {
    const user = await getCurrentUser()
    const session = await fetchAuthSession()
    const email = session.tokens?.idToken?.payload?.email
    return {
      username: user.username,
      email: typeof email === 'string' ? email : user.username,
    }
  } catch {
    return null
  }
}

export async function getIdToken(): Promise<string> {
  if (!isCognitoConfigured) {
    throw new Error('Cognito ist nicht konfiguriert.')
  }

  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  if (!token) {
    throw new Error('Die Anmeldung ist abgelaufen. Bitte erneut anmelden.')
  }
  return token
}

export async function registerAccount(input: {
  email: string
  password: string
  givenName: string
  familyName: string
}) {
  const email = input.email.trim().toLowerCase()
  const attributes: Record<string, string> = {}
  if (input.givenName.trim()) attributes.given_name = input.givenName.trim()
  if (input.familyName.trim()) attributes.family_name = input.familyName.trim()

  await signUp({
    username: email,
    password: input.password,
    options: Object.keys(attributes).length ? { userAttributes: attributes } : undefined,
  })

  return email
}

export async function loginAccount(email: string, password: string) {
  const result = await signIn({
    username: email.trim().toLowerCase(),
    password,
  })

  if (result.nextStep.signInStep !== 'DONE') {
    throw new Error('LOGIN_EXTRA_STEP')
  }
}

export async function logoutAccount() {
  await signOut()
}

export function mapAuthError(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : ''
  const message = error instanceof Error ? error.message : ''

  if (name === 'UsernameExistsException') {
    return 'Diese E-Mail ist bereits registriert.'
  }
  if (name === 'UserNotConfirmedException' || message.includes('User is not confirmed')) {
    return 'Dieses Konto wartet noch auf die Freigabe durch einen Admin.'
  }
  if (name === 'NotAuthorizedException') {
    return 'E-Mail oder Passwort ist falsch.'
  }
  if (name === 'UserNotFoundException') {
    return 'Es gibt kein Konto mit dieser E-Mail.'
  }
  if (name === 'InvalidPasswordException' || name === 'InvalidParameterException') {
    return 'Bitte ein gültiges Passwort verwenden (mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl und Sonderzeichen).'
  }
  if (name === 'LimitExceededException' || name === 'TooManyRequestsException') {
    return 'Zu viele Versuche. Bitte später erneut versuchen.'
  }
  if (message === 'LOGIN_EXTRA_STEP') {
    return 'Zusätzlicher Anmeldeschritt nötig. Bitte MFA in Cognito prüfen.'
  }
  if (message) return message
  return 'Die Aktion ist fehlgeschlagen. Bitte erneut versuchen.'
}
