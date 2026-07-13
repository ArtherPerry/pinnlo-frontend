'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useContact, useAddNote } from '@/hooks/useContacts'
import { Button, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { formatDate, cn } from '@/lib/utils'
import type { ActivityType } from '@/lib/types'
import { TagManager } from './TagManager'
import styles from './ContactDrawer.module.css'
import { AssignmentDropdown } from './AssignmentDropdown'
import { MessageCircle, FileText, Tag, User, RefreshCw, type LucideIcon } from 'lucide-react'
type Tab = 'info' | 'activity'

const ACTIVITY_CONFIG: Record<ActivityType, { icon: LucideIcon; dot: string }> = {
  MESSENGER_MESSAGE: { icon: MessageCircle, dot: 'message'  },
  WHATSAPP_MESSAGE:  { icon: MessageCircle, dot: 'message'  },
  LINE_MESSAGE:      { icon: MessageCircle, dot: 'message'  },
  NOTE:              { icon: FileText,      dot: 'note'     },
  TAG_ADDED:         { icon: Tag,           dot: 'tag'      },
  TAG_REMOVED:       { icon: Tag,           dot: 'tag'      },
  ASSIGNED:          { icon: User,          dot: 'assigned' },
  UNASSIGNED:        { icon: User,          dot: 'assigned' },
  STATUS_CHANGED:    { icon: RefreshCw,     dot: 'system'   },
}

interface ContactDrawerProps {
  contactId: string
  onClose:   () => void
}

export function ContactDrawer({ contactId, onClose }: ContactDrawerProps) {
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [note,      setNote     ] = useState('')

  const { data: contact, isLoading } = useContact(contactId)
  const addNote = useAddNote(contactId)
  const toast   = useToast()

  const handleAddNote = async () => {
    if (!note.trim()) return
    try {
      await addNote.mutateAsync(note.trim())
      setNote('')
      toast.show('Note added ✓', 'success')
    } catch {
      toast.show('Failed to add note', 'error')
    }
  }

  const initials = contact?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?'

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Drawer */}
      <div className={styles.drawer}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>{initials}</div>
            {contact && (
              <div className={styles.headerInfo}>
                <span className={styles.name}>{contact.name}</span>
                <span className={styles.clientBadge}>{contact.clientName}</span>
              </div>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={cn(styles.tab, activeTab === 'info' && styles.tabActive)}
            onClick={() => setActiveTab('info')}
          >
            Contact info
          </button>
          <button
            className={cn(styles.tab, activeTab === 'activity' && styles.tabActive)}
            onClick={() => setActiveTab('activity')}
          >
            Activity ({contact?.activities?.length ?? 0})
          </button>
        </div>

        {/* Body */}
        {isLoading || !contact ? (
          <div className={styles.loading}>Loading contact...</div>
        ) : (
          <div className={styles.body}>

            {/* ── Info tab ── */}
            {activeTab === 'info' && (
              <>
                {/* Contact details */}
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>CONTACT DETAILS</span>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Phone</span>
                      {contact.phone
                        ? <span className={styles.infoValue}>{contact.phone}</span>
                        : <span className={styles.infoValueMuted}>Not provided</span>
                      }
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email</span>
                      {contact.email
                        ? <span className={styles.infoValue}>{contact.email}</span>
                        : <span className={styles.infoValueMuted}>Not provided</span>
                      }
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Source</span>
                      <span className={styles.infoValue}>
                        {contact.source.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Added</span>
                      <span className={styles.infoValue}>
                        {formatDate(contact.createdAt, locale, {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Last active</span>
                      {contact.lastActiveAt
                        ? <span className={styles.infoValue}>
                            {formatDate(contact.lastActiveAt, locale, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        : <span className={styles.infoValueMuted}>Unknown</span>
                      }
                    </div>
                    <div className={styles.infoItem}>
  <span className={styles.infoLabel}>Assigned to</span>
  <AssignmentDropdown
    contactId={contact.id}
    assignedTo={contact.assignedTo}
  />
</div>
                  </div>
                </div>

                {/* Connected platforms */}
                {(contact.fbPsid || contact.waId || contact.lineUid) && (
                  <div className={styles.section}>
                    <span className={styles.sectionTitle}>CONNECTED PLATFORMS</span>
                    <div className={styles.platformChips}>
                      {contact.fbPsid && (
                        <div className={styles.platformChip}>
                          <PlatformIcon platform="FACEBOOK" size={13} />
                          Messenger
                        </div>
                      )}
                      {contact.waId && (
                        <div className={styles.platformChip}>
                          <PlatformIcon platform="WHATSAPP" size={13} />
                          WhatsApp
                        </div>
                      )}
                      {contact.lineUid && (
                        <div className={styles.platformChip}>
                          <PlatformIcon platform="LINE" size={13} />
                          LINE
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags — TagManager only, no duplicate */}
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>TAGS</span>
                  <TagManager
                    contactId={contact.id}
                    tags={contact.tags}
                  />
                </div>

                {/* Notes */}
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>NOTES</span>
                  <div className={cn(
                    styles.notesBox,
                    !contact.notes && styles.notesEmpty
                  )}>
                    {contact.notes ?? 'No notes yet'}
                  </div>
                </div>
              </>
            )}

            {/* ── Activity tab ── */}
            {activeTab === 'activity' && (
              <>
                {/* Add note form */}
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>ADD NOTE</span>
                  <div className={styles.noteForm}>
                    <textarea
                      className={styles.noteTextarea}
                      placeholder="Write a note about this contact..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className={styles.noteActions}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddNote}
                        disabled={!note.trim()}
                        loading={addNote.isPending}
                      >
                        Add note
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>TIMELINE</span>
                  {contact.activities.length === 0 ? (
                    <span className={styles.infoValueMuted}>No activity yet</span>
                  ) : (
                    <div className={styles.timeline}>
                      {contact.activities.map((activity) => {
                        const config = ACTIVITY_CONFIG[activity.type] ?? {
                          icon: RefreshCw, dot: 'system',
                        }
                        const ActivityIcon = config.icon
                        return (
                          <div key={activity.id} className={styles.timelineItem}>
                            <div className={cn(
                              styles.timelineDot,
                              styles[config.dot]
                            )}>
                              <ActivityIcon size={13} />
                            </div>
                            <div className={styles.timelineContent}>
                              <div className={styles.timelineText}>
                                {activity.content}
                              </div>
                              <div className={styles.timelineMeta}>
                                <span className={styles.timelineBy}>
                                  {activity.createdBy}
                                </span>
                                <span className={styles.timelineTime}>
                                  {formatDate(activity.createdAt, locale, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </>
  )
}