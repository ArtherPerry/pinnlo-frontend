import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Client {
  id:        string
  name:      string
  platforms: string[]
  status:    string
}

interface PagedClients {
  content:       Client[]
  totalElements: number
  totalPages:    number
  page:          number
  size:          number
}

export function useClients() {
  return useQuery({
    queryKey: ['clients', 'list'],
    queryFn: async () => {
      const { data } = await api.get<PagedClients>('/api/clients', {
        params: { size: 100 },
      })
      return data.content
    },
  })
}