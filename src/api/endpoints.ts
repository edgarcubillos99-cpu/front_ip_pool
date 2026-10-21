import { apiClient } from './client'
import type {
  AssignedIPView,
  IPView,
  LatestIPsResponse,
  ListAssignedParams,
  ListIPsParams,
  LoginRequest,
  LoginResponse,
  PaginatedResponse,
  StatsResponse,
  TowersResponse,
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
