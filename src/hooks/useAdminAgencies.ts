import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface AdminAgency {
  id: string
  name: string
  status: string
  plan: string
  createdAt: string
}

async function fetchAgencies(): Promise<AdminAgency[]> {
  const { data } = await api.get('/api/v1/admin/agencies')
  return data
}

export function useAgencies() {
  return useQuery({
    queryKey: ['admin', 'agencies'],
    queryFn: fetchAgencies,
  })
}

export function useApproveAgency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/admin/agencies/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'agencies'] }),
  })
}

export function useSuspendAgency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/admin/agencies/${id}/suspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'agencies'] }),
  })
}

export function useSetPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) =>
      api.post(`/api/v1/admin/agencies/${id}/plan`, { plan }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'agencies'] }),
  })
}

export interface AgencyUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  platformAdmin: boolean
}

export interface AgencyClient {
  id: string
  name: string
  status: string
  platformCount: number
}

export interface AgencyDetail {
  id: string
  name: string
  status: string
  plan: string
  createdAt: string
  userCount: number
  clientCount: number
  users: AgencyUser[]
  clients: AgencyClient[]
}

async function fetchAgencyDetail(id: string): Promise<AgencyDetail> {
  const { data } = await api.get(`/api/v1/admin/agencies/${id}`)
  return data
}

export function useAgencyDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'agencies', 'detail', id],
    queryFn: () => fetchAgencyDetail(id!),
    enabled: !!id,
  })
}

export interface PlatformStats {
  totalAgencies: number
  pendingAgencies: number
  approvedAgencies: number
  suspendedAgencies: number
  totalUsers: number
  totalClients: number
  planBreakdown: Record<string, number>
}

async function fetchStats(): Promise<PlatformStats> {
  const { data } = await api.get('/api/v1/admin/stats')
  return data
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchStats,
  })
}
export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  platformAdmin: boolean
  agencyId: string
  agencyName: string
}

async function fetchAllUsers(): Promise<AdminUser[]> {
  const { data } = await api.get('/api/v1/admin/users')
  return data
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchAllUsers,
  })
}

export function useSetUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.post(`/api/v1/admin/users/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export interface AuditLogEntry {
  id: string
  actorName: string
  action: string
  targetType: string
  targetName: string | null
  createdAt: string
}

async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const { data } = await api.get('/api/v1/admin/audit')
  return data
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: fetchAuditLogs,
  })
}

export function useCreateAgency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { agencyName: string; ownerName: string; ownerEmail: string; plan: string }) =>
      api.post('/api/v1/admin/agencies', input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'agencies'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useImpersonate() {
  return useMutation({
    mutationFn: (agencyId: string) =>
      api.post(`/api/v1/admin/agencies/${agencyId}/impersonate`).then((r) => r.data),
  })
}