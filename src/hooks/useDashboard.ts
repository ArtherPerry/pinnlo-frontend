import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface DashboardStats {
  totalClients:    number
  scheduledPosts:  number
  newLeads:        number
  unreadComments:  number
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/api/dashboard/stats')
  return data
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn:  fetchDashboardStats,
  })
}