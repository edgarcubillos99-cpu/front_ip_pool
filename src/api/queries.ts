import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRefreshInterval } from '@/lib/refresh'
import type { ListAssignedParams, ListIPsParams } from '@/types/api'
import {
  fetchAssignedIPs,
  fetchIPs,
  fetchLatestIPs,
  fetchStats,
  fetchTowers,
  fetchUsers,
} from './endpoints'

export const queryKeys = {
  stats: ['stats'] as const,
  towers: ['towers'] as const,
  ips: (p: ListIPsParams) => ['ips', p] as const,
  assigned: (p: ListAssignedParams) => ['assigned-ips', p] as const,
  latest: (limit: number) => ['ips-latest', limit] as const,
  users: ['users'] as const,
}

export function useStats() {
  const refetchInterval = useRefreshInterval()
  return useQuery({ queryKey: queryKeys.stats, queryFn: fetchStats, refetchInterval })
}

export function useTowers() {
  const refetchInterval = useRefreshInterval()
  return useQuery({ queryKey: queryKeys.towers, queryFn: fetchTowers, refetchInterval })
}

export function useIPs(params: ListIPsParams) {
  const refetchInterval = useRefreshInterval()
  return useQuery({
    queryKey: queryKeys.ips(params),
    queryFn: () => fetchIPs(params),
    placeholderData: keepPreviousData,
    refetchInterval,
  })
}

export function useAssignedIPs(params: ListAssignedParams) {
  const refetchInterval = useRefreshInterval()
  return useQuery({
    queryKey: queryKeys.assigned(params),
    queryFn: () => fetchAssignedIPs(params),
    placeholderData: keepPreviousData,
    refetchInterval,
  })
}

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: fetchUsers })
}

export function useLatestIPs(limit = 10) {
  const refetchInterval = useRefreshInterval()
  return useQuery({
    queryKey: queryKeys.latest(limit),
    queryFn: () => fetchLatestIPs(limit),
    refetchInterval,
  })
}
