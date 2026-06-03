import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Client {
  id:        string
  name:      string
  platforms: string[]
  status:    string
}

async function fetchClients(): Promise<Client[]> {
  const { data } = await api.get('/api/clients')
  return data.content
}

export function useClients() {
  return useQuery({
    queryKey: ['clients', 'list'],
    queryFn:  fetchClients,
  })
}