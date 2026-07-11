import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'
import type { Contact, CreateContactInput } from '@/lib/types'

// ── Query keys ────────────────────────────────────────────────────
export const contactKeys = {
  all:    ()                     => ['contacts']              as const,
  list:   (filters: object = {}) => ['contacts', 'list', filters] as const,
  detail: (id: string)           => ['contacts', 'detail', id] as const,
}

// ── Fetch contacts ────────────────────────────────────────────────
async function fetchContacts(search?: string, tag?: string): Promise<Contact[]> {
  const params: Record<string, string> = {}
  if (search) params.search = search
  if (tag)    params.tag    = tag
  const { data } = await api.get('/api/contacts', { params })
  return data.content
}

export function useContacts(search?: string, tag?: string) {
  return useQuery({
    queryKey: contactKeys.list({ search, tag }),
    queryFn:  () => fetchContacts(search, tag),
  })
}

// ── Fetch single contact ──────────────────────────────────────────
async function fetchContact(id: string): Promise<Contact> {
  const { data } = await api.get(`/api/contacts/${id}`)
  return data
}

export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn:  () => fetchContact(id),
    enabled:  !!id,
  })
}

// ── Create contact ────────────────────────────────────────────────
export function useCreateContact() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { data } = await api.post('/api/contacts', input)
      return data as Contact
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: contactKeys.all() })

      const optimistic: Contact = {
        id:           `temp-${Date.now()}`,
        name:         input.name,
        phone:        input.phone ?? null,
        email:        input.email ?? null,
        fbPsid:       null,
        waId:         null,
        lineUid:      null,
        source:       input.source,
        tags:         input.tags ?? [],
        assignedTo:   input.assignedTo ?? null,
        clientId:     input.clientId,
        clientName:   '',
        notes:        input.notes ?? null,
        lastActiveAt: null,
        createdAt:    new Date().toISOString(),
        activities:   [],
      }

      qc.setQueriesData(
        { queryKey: contactKeys.all() },
        (old: Contact[] | undefined) =>
          old ? [optimistic, ...old] : [optimistic]
      )

      return { optimistic }
    },
    onSuccess: (newContact, _input, context) => {
     qc.setQueriesData(
        { queryKey: contactKeys.all() },
        (old: Contact[] | undefined) =>
          Array.isArray(old)
            ? old.map((c) => c.id === context?.optimistic.id ? newContact : c)
            : [newContact]
      )
    },
    onError: (_err, _input, context) => {
      qc.setQueriesData(
        { queryKey: contactKeys.all() },
        (old: Contact[] | undefined) =>
          Array.isArray(old) ? old.filter((c) => c.id !== context?.optimistic.id) : []
      )
    },
  })
}

// ── Update contact ────────────────────────────────────────────────
export function useUpdateContact(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<CreateContactInput>) => {
      const { data } = await api.patch(`/api/contacts/${id}`, input)
      return data as Contact
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: contactKeys.detail(id) })
      await qc.cancelQueries({ queryKey: contactKeys.all() })

      const snapshot = qc.getQueryData<Contact>(contactKeys.detail(id))

      // Update detail cache
      qc.setQueryData(
        contactKeys.detail(id),
        (old: Contact | undefined) => old ? { ...old, ...input } : old
      )

      // Update list cache
      qc.setQueriesData(
        { queryKey: contactKeys.all() },
        (old: Contact[] | undefined) =>
          Array.isArray(old)
            ? old.map((c) => c.id === id ? { ...c, ...input } : c)
            : old
      )

      return { snapshot }
    },
    onError: (_err, _input, context) => {
      if (context?.snapshot) {
        qc.setQueryData(contactKeys.detail(id), context.snapshot)
      }
    },
  })
}

// ── Delete contact ────────────────────────────────────────────────
export function useDeleteContact() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/contacts/${id}`)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: contactKeys.all() })

      const snapshot = qc.getQueriesData({ queryKey: contactKeys.all() })

      qc.setQueriesData(
        { queryKey: contactKeys.all() },
        (old: Contact[] | undefined) =>
          old ? old.filter((c) => c.id !== id) : []
      )

      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, value]) => {
          qc.setQueryData(key, value)
        })
      }
    },
    onSuccess: () => {},
  })
}

// ── Add note ──────────────────────────────────────────────────────
export function useAddNote(contactId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post(
        `/api/contacts/${contactId}/notes`,
        { content }
      )
      return data
    },
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: contactKeys.detail(contactId) })

      const optimisticActivity = {
        id:        `act-temp-${Date.now()}`,
        type:      'NOTE' as const,
        content,
        createdBy: 'You',
        createdAt: new Date().toISOString(),
      }

      qc.setQueryData(
        contactKeys.detail(contactId),
        (old: Contact | undefined) =>
          old
            ? { ...old, activities: [optimisticActivity, ...old.activities] }
            : old
      )

      return { optimisticActivity }
    },
    onSuccess: (newActivity, _content, context) => {
      // Replace temp activity with real one
      qc.setQueryData(
        contactKeys.detail(contactId),
        (old: Contact | undefined) =>
          old
            ? {
                ...old,
                activities: old.activities.map((a) =>
                  a.id === context?.optimisticActivity.id ? newActivity : a
                ),
              }
            : old
      )
    },
    onError: (_err, _content, context) => {
      qc.setQueryData(
        contactKeys.detail(contactId),
        (old: Contact | undefined) =>
          old
            ? {
                ...old,
                activities: old.activities.filter(
                  (a) => a.id !== context?.optimisticActivity.id
                ),
              }
            : old
      )
    },
  })
}

// ── Add tag ───────────────────────────────────────────────────────
export function useAddTag(contactId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (tag: string) => {
      const { data } = await api.post(
        `/api/contacts/${contactId}/tags`,
        { tag }
      )
      return data
    },
    onMutate: async (tag) => {
      await qc.cancelQueries({ queryKey: contactKeys.detail(contactId) })

      const snapshot = qc.getQueryData<Contact>(contactKeys.detail(contactId))

      // Add tag to detail cache immediately
      qc.setQueryData(
        contactKeys.detail(contactId),
        (old: Contact | undefined) =>
          old && !old.tags.includes(tag)
            ? { ...old, tags: [...old.tags, tag] }
            : old
      )

      // Add tag to list cache
      qc.setQueriesData(
        { queryKey: contactKeys.all() },
        (old: Contact[] | undefined) =>
          Array.isArray(old)
            ? old.map((c) =>
                c.id === contactId && !c.tags.includes(tag)
                  ? { ...c, tags: [...c.tags, tag] }
                  : c
              )
            : old
      )

      return { snapshot }
    },
    onError: (_err, _tag, context) => {
      if (context?.snapshot) {
        qc.setQueryData(contactKeys.detail(contactId), context.snapshot)
      }
    },
  })
}

// ── Remove tag ────────────────────────────────────────────────────
export function useRemoveTag(contactId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (tag: string) => {
      await api.delete(`/api/contacts/${contactId}/tags/${tag}`)
      return tag
    },
    onMutate: async (tag) => {
      await qc.cancelQueries({ queryKey: contactKeys.detail(contactId) })

      const snapshot = qc.getQueryData<Contact>(contactKeys.detail(contactId))

      // Remove tag from detail cache immediately
      qc.setQueryData(
        contactKeys.detail(contactId),
        (old: Contact | undefined) =>
          old
            ? { ...old, tags: old.tags.filter((t) => t !== tag) }
            : old
      )

      // Remove tag from list cache
      qc.setQueriesData(
        { queryKey: contactKeys.all() },
        (old: Contact[] | undefined) =>
          Array.isArray(old)
            ? old.map((c) =>
                c.id === contactId
                  ? { ...c, tags: c.tags.filter((t) => t !== tag) }
                  : c
              )
            : old
      )

      return { snapshot }
    },
    onError: (_err, _tag, context) => {
      if (context?.snapshot) {
        qc.setQueryData(contactKeys.detail(contactId), context.snapshot)
      }
    },
  })
}

// ── Assign contact ────────────────────────────────────────────────
export function useAssignContact(contactId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (assignedTo: string | null) => {
      const { data } = await api.patch(
        `/api/contacts/${contactId}/assign`,
        { assignedTo }
      )
      return data
    },
    onMutate: async (assignedTo) => {
      await qc.cancelQueries({ queryKey: contactKeys.detail(contactId) })

      const snapshot = qc.getQueryData<Contact>(contactKeys.detail(contactId))

      // Update detail cache immediately
      qc.setQueryData(
        contactKeys.detail(contactId),
        (old: Contact | undefined) =>
          old ? { ...old, assignedTo } : old
      )

      // Update list cache
      qc.setQueriesData(
        { queryKey: contactKeys.all() },
        (old: Contact[] | undefined) =>
          Array.isArray(old)
            ? old.map((c) =>
                c.id === contactId ? { ...c, assignedTo } : c
              )
            : old
      )

      return { snapshot }
    },
    onError: (_err, _assignedTo, context) => {
      if (context?.snapshot) {
        qc.setQueryData(contactKeys.detail(contactId), context.snapshot)
      }
    },
  })
}

// ── Team members ──────────────────────────────────────────────────
interface TeamMember {
  id:   string
  name: string
  role: string
}

async function fetchTeam(): Promise<TeamMember[]> {
  const { data } = await api.get('/api/settings/team')
  return data
}

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn:  fetchTeam,
    staleTime: 1000 * 60 * 10,
  })
}

// ── CSV export ────────────────────────────────────────────────────
export async function exportContactsCSV(): Promise<void> {
  const response = await api.get('/api/contacts/export/csv', {
    responseType: 'blob',
  })

  const url  = URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', 'contacts.csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}