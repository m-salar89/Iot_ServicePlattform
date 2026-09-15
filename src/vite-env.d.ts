/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STAFF_USER_POOL_ID: string
  readonly VITE_STAFF_COGNITO_CLIENT_ID: string
  readonly VITE_PROCESS_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
