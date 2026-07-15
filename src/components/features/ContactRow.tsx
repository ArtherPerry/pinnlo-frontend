'use client'

import { useState } from 'react'
import type { Contact } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PlatformIcon } from '@/components/ui'
import { useDeleteContact } from '@/hooks/useContacts'
import { useToast } from '@/hooks/useToast'
import type { Platform } from '@/lib/types'
import styles from './ContactRow.module.css'

const SOURCE_PLATFORM: Record<string, Platform | null> = {
  MESSENGER:  'FACEBOOK',
  WHATSAPP:   'WHATSAPP',
  LINE:       'LINE',
  MANUAL:     null,
  CSV_IMPORT: null,
}

const SOURCE_LABEL: Record<string, string> = {
  MESSENGER:  'Messenger',
  WHATSAPP:   'WhatsApp',
  LINE:       'LINE',
  MANUAL:     'Manual',
  CSV_IMPORT: 'CSV Import',
}

interface ContactRowProps {
  contact:  Contact
  isActive: boolean
  onClick:  () => void
}

export function ContactRow({ contact, isActive, onClick }: ContactRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteContact = useDeleteContact()
  const toast         = useToast()
  const platform      = SOURCE_PLATFORM[contact.source]

  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteContact.mutateAsync(contact.id)
      toast.show('Contact deleted', 'success')
      setConfirmDelete(false)
    } catch {
      toast.show('Failed to delete contact', 'error')
    }
  }

  return (
    <>
      <div
        className={cn(styles.row, isActive && styles.rowActive)}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        {/* Contact info */}
        <div className={styles.contactCell}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.contactInfo}>
            <span className={styles.name}>{contact.name}</span>
            <span className={styles.sub}>
              {contact.phone ?? contact.email ?? 'No contact info'}
            </span>
          </div>
        </div>

        {/* Client */}
        <div className={styles.cell}>
          <span className={styles.clientName}>{contact.clientName}</span>
        </div>

        {/* Source */}
        <div className={styles.cell}>
          <span className={styles.source}>
            {platform && <PlatformIcon platform={platform} size={13} />}
            {SOURCE_LABEL[contact.source]}
          </span>
        </div>

        {/* Tags */}
        <div className={styles.cell}>
          <div className={styles.tags}>
            {contact.tags.slice(0, 2).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
            {contact.tags.length > 2 && (
              <span className={styles.tagMore}>+{contact.tags.length - 2}</span>
            )}
          </div>
        </div>

        {/* Assigned + delete */}
        <div className={cn(styles.cell, styles.lastCell)}>
          {contact.assignedTo ? (
            <span className={styles.assigned}>{contact.assignedTo}</span>
          ) : (
            <span className={styles.unassigned}>Unassigned</span>
          )}
          <button
            className={styles.deleteBtn}
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            aria-label={`Delete ${contact.name}`}
          >
            ×
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300,
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              maxWidth: '360px',
              width: '90%',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                Delete {contact.name}?
              </p>
              <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
                All activity history and notes will be permanently removed.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  height: '32px', padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-2)',
                  cursor: 'pointer', fontSize: 'var(--text-small)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteContact.isPending}
                style={{
                  height: '32px', padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--color-danger)',
                  color: 'white', cursor: 'pointer',
                  fontSize: 'var(--text-small)',
                  fontFamily: 'var(--font-sans)',
                  opacity: deleteContact.isPending ? 0.5 : 1,
                }}
              >
                {deleteContact.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}