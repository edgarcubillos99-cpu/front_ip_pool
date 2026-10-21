import axios, { AxiosError } from 'axios'
import { config } from '@/config'
import { clearSession, getToken } from '@/lib/auth'
import type { ApiErrorBody } from '@/types/api'

export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((req) => {
  const token = getToken()
  if (token) {
    req.headers.Authorization = `Bearer ${token}`
  }
  return req
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLogin = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLogin) {
      // El ProtectedRoute reacciona al cambio de sesión y redirige a /login.
      clearSession()
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.data?.error) return error.response.data.error
    if (error.code === 'ECONNABORTED') return 'La API tardó demasiado en responder.'
    if (!error.response) {
      return `No se pudo conectar con la API (${config.apiUrl}). Verifique la URL, la red o CORS_ALLOWED_ORIGINS en el backend.`
    }
    return `Error ${error.response.status} al consultar la API.`
  }
  return error instanceof Error ? error.message : 'Error desconocido.'
}
