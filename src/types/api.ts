// Espejo de los DTOs de Api-ObtenerIps-Torres:
// internal/ippool/query.go, internal/service/pool.go e internal/auth/auth.go

export type IPStatus = 'available' | 'assigned' | 'failed'

export interface IPView {
  id: number
  device_name: string
  device_ip: string
  gateway: string
  ip_address: string
  cidr: string
  subnet_mask: string
  interface: string
  status: IPStatus
  ticket_id: number | null
  created_at: string
}

export interface AssignedIPView {
  id: number
  pool_id?: number
  device_name: string
  device_ip: string
  gateway: string
  ip_address: string
  cidr: string
  subnet_mask: string
  interface: string
  ticket_id: number
  comment: string
  assigned_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface LatestIPsResponse {
  created: IPView[]
  assigned: AssignedIPView[]
}

export interface TowerStockView {
  name: string
  ip: string
  map_name: string
  available: number
  assigned: number
  total: number
  last_created_at: string | null
  low_stock: boolean
}

export interface TowersResponse {
  towers: TowerStockView[]
  count: number
  min_available: number
}

export interface StatsResponse {
  total: number
  available: number
  assigned: number
  failed: number
  created_last_24h: number
  last_created_at: string | null
  towers_active: number
  towers_low_stock: number
  towers_empty: number
  min_available: number
  refill_batch: number
  dry_run: boolean
  generated_at: string
}

export type UserRole = 'admin' | 'operator'

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  username: string
  role: UserRole
}

export interface MFAChallengeResponse {
  mfa_required: true
  mfa_token: string
  token_type: string
  expires_in: number
  email_hint: string
}

export type LoginResponse = TokenResponse | MFAChallengeResponse

export function isMFAChallenge(data: LoginResponse): data is MFAChallengeResponse {
  return 'mfa_required' in data && data.mfa_required === true
}

export interface AppUser {
  id: number
  username: string
  email: string
  role: UserRole
  mfa_enabled: boolean
  active: boolean
  created_at: string
}

export interface UsersResponse {
  users: AppUser[]
  count: number
}

export interface CreateUserRequest {
  username: string
  password: string
  email?: string
  role: UserRole
  mfa_enabled: boolean
}

export interface UpdateUserRequest {
  email?: string
  role?: UserRole
  mfa_enabled?: boolean
  active?: boolean
  password?: string
}

export interface ApiErrorBody {
  error: string
}

export interface ListIPsParams {
  status?: IPStatus
  torre?: string
  q?: string
  page?: number
  page_size?: number
}

export type ListAssignedParams = Omit<ListIPsParams, 'status'>
