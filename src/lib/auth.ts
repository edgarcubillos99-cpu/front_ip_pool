import { useSyncExternalStore } from 'react'
import type { UserRole } from '@/types/api'

const STORAGE_KEY = 'ippool.session'

export interface Session {
  token: string
  username: string
  role: UserRole
  expiresAt: number
}

type Listener = () => void

const listeners = new Set<Listener>()
let expiryTimer: ReturnType<typeof setTimeout> | undefined

function read(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (!session.token || session.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    if (session.role !== 'admin' && session.role !== 'operator') {
      session.role = 'operator'
    }
    return session
  } catch {
    return null
  }
}

let current: Session | null = read()

function scheduleExpiry() {
  clearTimeout(expiryTimer)
  if (!current) return
  const ms = Math.min(current.expiresAt - Date.now(), 2 ** 31 - 1)
  expiryTimer = setTimeout(() => clearSession(), Math.max(ms, 0))
}

function emit() {
  scheduleExpiry()
  listeners.forEach((l) => l())
}

export function setSession(token: string, username: string, role: UserRole, expiresInSeconds: number) {
  current = { token, username, role, expiresAt: Date.now() + expiresInSeconds * 1000 }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  emit()
}

export function clearSession() {
  if (!current) return
  current = null
  localStorage.removeItem(STORAGE_KEY)
  emit()
}

export function getToken(): string | null {
  if (current && current.expiresAt <= Date.now()) clearSession()
  return current?.token ?? null
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return
  current = read()
  emit()
})

scheduleExpiry()

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, () => current)
}
