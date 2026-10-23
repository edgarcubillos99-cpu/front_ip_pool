import { apiClient } from './client'
import type {
  AppUser,
  AssignedIPView,
  CreateUserRequest,
  IPView,
  LatestIPsResponse,
  ListAssignedParams,
  ListIPsParams,
  LoginRequest,
  LoginResponse,
  PaginatedResponse,
  StatsResponse,
  TowersResponse,
  UpdateUserRequest,
  UsersResponse,
} from '@/types/api'

/** Quita parámetros vacíos para no enviar `?q=&torre=` al backend. */
function clean<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/v1/auth/login', body)
  return data
}

export async function verifyMFA(mfa_token: string, code: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/v1/auth/mfa/verify', { mfa_token, code })
  return data
}

export async function resendMFA(mfa_token: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/v1/auth/mfa/resend', { mfa_token })
  return data
}

export async function fetchUsers(): Promise<UsersResponse> {
  const { data } = await apiClient.get<UsersResponse>('/api/v1/users')
  return data
}

export async function createUser(body: CreateUserRequest): Promise<AppUser> {
  const { data } = await apiClient.post<AppUser>('/api/v1/users', body)
  return data
}

export async function updateUser(id: number, body: UpdateUserRequest): Promise<AppUser> {
  const { data } = await apiClient.patch<AppUser>(`/api/v1/users/${id}`, body)
  return data
}

export async function deactivateUser(id: number): Promise<AppUser> {
  const { data } = await apiClient.delete<AppUser>(`/api/v1/users/${id}`)
  return data
}

export async function fetchStats(): Promise<StatsResponse> {
  const { data } = await apiClient.get<StatsResponse>('/api/v1/stats')
  return data
}

export async function fetchTowers(): Promise<TowersResponse> {
  const { data } = await apiClient.get<TowersResponse>('/api/v1/towers')
  return data
}

export async function fetchIPs(params: ListIPsParams): Promise<PaginatedResponse<IPView>> {
  const { data } = await apiClient.get<PaginatedResponse<IPView>>('/api/v1/ips', {
    params: clean(params),
  })
  return data
}

export async function fetchAssignedIPs(
  params: ListAssignedParams,
): Promise<PaginatedResponse<AssignedIPView>> {
  const { data } = await apiClient.get<PaginatedResponse<AssignedIPView>>('/api/v1/assigned-ips', {
    params: clean(params),
  })
  return data
}

export async function fetchLatestIPs(limit = 10): Promise<LatestIPsResponse> {
  const { data } = await apiClient.get<LatestIPsResponse>('/api/v1/ips/latest', {
    params: { limit },
  })
  return data
}
