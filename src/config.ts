declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_URL?: string
    }
  }
}

function resolveApiUrl(): string {
  const runtime = window.__APP_CONFIG__?.API_URL?.trim()
  const url = runtime || import.meta.env.VITE_API_URL || 'http://localhost:8082'
  return url.replace(/\/+$/, '')
}

export const config = {
  apiUrl: resolveApiUrl(),
}
