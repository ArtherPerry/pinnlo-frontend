'use client'

import { useState, useCallback } from 'react'
import { useContacts, exportContactsCSV } from '@/hooks/useContacts'
import { Button } from '@/components/ui'
import { ContactRow } from '@/components/features/ContactRow'
import { cn } from '@/lib/utils'
import { usePlan } from '@/hooks/usePlan'
import { useToast } from '@/hooks/useToast'
import styles from './crm.module.css'
import { ContactDrawer } from '@/components/features/ContactDrawer'
import { AddContactModal } from '@/components/features/AddContactModal'

const ALL_TAGS = ['vip', 'interested', 'corporate', 'follow-up', 'new']

export default function CRMPage() {
  const [search,      setSearch     ] = useState('')
  const [activeTag,   setActiveTag  ] = useState<string | undefined>()
  const [showForm,    setShowForm   ] = useState(false)
  const [activeContact, setActiveContact] = useState<string | null>(null)

  const plan  = usePlan()
  const toast = useToast()

  // Debounce search — only query after 300ms of no typing
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debounceTimer,   setDebounceTimer  ] = useState<ReturnType<typeof setTimeout>>()

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => setDebouncedSearch(value), 300)
    setDebounceTimer(timer)
  }, [debounceTimer])

  const { data: contacts, isLoading, isError } = useContacts(
    debouncedSearch || undefined,
    activeTag
  )

  const handleExport = async () => {
    if (!plan.canExportCSV) {
      toast.show('CSV export requires Pro plan or above', 'warning')
      return
    }
    try {
      await exportContactsCSV()
      toast.show('Contacts exported ✓', 'success')
    } catch {
      toast.show('Export failed', 'error')
    }
  }

  // Compute stats from loaded contacts
  const totalContacts  = contacts?.length ?? 0
  const newToday       = contacts?.filter((c) => {
    const created = new Date(c.createdAt)
    const today   = new Date()
    return created.toDateString() === today.toDateString()
  }).length ?? 0
  const unassigned = contacts?.filter((c) => !c.assignedTo).length ?? 0

  return (
    <div className={styles.page}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>

          {/* Search */}
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                   stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="6" r="4.5"/>
                <path d="M9.5 9.5L13 13"/>
              </svg>
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Tag filters */}
          <div className={styles.tagFilters}>
            <button
              className={cn(styles.tagPill, !activeTag && styles.tagPillActive)}
              onClick={() => setActiveTag(undefined)}
            >
              All
            </button>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                className={cn(styles.tagPill, activeTag === tag && styles.tagPillActive)}
                onClick={() => setActiveTag(activeTag === tag ? undefined : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            + Add contact
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalContacts}</div>
          <div className={styles.statLabel}>Total contacts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{newToday}</div>
          <div className={styles.statLabel}>New today</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{unassigned}</div>
          <div className={styles.statLabel}>Unassigned</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {contacts?.filter((c) => c.tags.includes('vip')).length ?? 0}
          </div>
          <div className={styles.statLabel}>VIP contacts</div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className={styles.skeleton}>
          {[1,2,3,4,5].map((n) => (
            <div key={n} className={styles.skeletonRow} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Failed to load contacts</div>
          <div className={styles.emptySub}>Check your connection and try again.</div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && contacts?.length === 0 && (
        <div className={styles.empty}>
          <svg className={styles.emptyIcon} viewBox="0 0 48 48"
               fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="24" cy="16" r="8"/>
            <path d="M6 40c0-9.941 8.059-18 18-18s18 8.059 18 18"/>
          </svg>
          <div className={styles.emptyTitle}>
            {debouncedSearch || activeTag ? 'No contacts found' : 'No contacts yet'}
          </div>
          <div className={styles.emptySub}>
            {debouncedSearch || activeTag
              ? 'Try a different search term or filter.'
              : 'Contacts auto-appear when someone messages your Facebook page, or add one manually.'}
          </div>
          {!debouncedSearch && !activeTag && (
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
              + Add first contact
            </Button>
          )}
        </div>
      )}

      {/* Contact list */}
      {!isLoading && !isError && contacts && contacts.length > 0 && (
        <div className={styles.list}>
          {/* List header */}
          <div className={styles.listHeader}>
            <span>CONTACT</span>
            <span>CLIENT</span>
            <span>SOURCE</span>
            <span>TAGS</span>
            <span>ASSIGNED TO</span>
          </div>

          {contacts.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              isActive={activeContact === contact.id}
              onClick={() => setActiveContact(
                activeContact === contact.id ? null : contact.id
              )}
            />
          ))}
        </div>
      )}

      {/* Add contact modal — Step 8 */}
      {showForm && (
  <AddContactModal onClose={() => setShowForm(false)} />
)}
    {/* Contact detail drawer */}
{activeContact && (
  <ContactDrawer
    contactId={activeContact}
    onClose={() => setActiveContact(null)}
  />
)}
    </div>
  )
}