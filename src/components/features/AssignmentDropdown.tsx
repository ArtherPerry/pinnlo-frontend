'use client'

import { useState, useRef, useEffect } from 'react'
import { useTeam, useAssignContact } from '@/hooks/useContacts'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import styles from './AssignmentDropdown.module.css'

interface AssignmentDropdownProps {
  contactId:  string
  assignedTo: string | null
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AssignmentDropdown({
  contactId,
  assignedTo,
}: AssignmentDropdownProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef      = useRef<HTMLDivElement>(null)

  const { data: team }  = useTeam()
  const assign          = useAssignContact(contactId)
  const toast           = useToast()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAssign = async (name: string | null) => {
    setOpen(false)
    if (name === assignedTo) return

    try {
      await assign.mutateAsync(name)
      if (name) {
        toast.show(`Assigned to ${name} ✓`, 'success')
      } else {
        toast.show('Unassigned ✓', 'info')
      }
    } catch {
      toast.show('Failed to update assignment', 'error')
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>

      {/* Trigger button */}
      <button
        className={cn(
          styles.trigger,
          !assignedTo && styles.triggerUnassigned
        )}
        onClick={() => setOpen((o) => !o)}
        disabled={assign.isPending}
      >
        {assignedTo ? (
          <>
            <div className={styles.avatar}>
              {getInitials(assignedTo)}
            </div>
            {assign.isPending ? 'Saving...' : assignedTo}
          </>
        ) : (
          assign.isPending ? 'Saving...' : 'Unassigned'
        )}
        <span className={styles.chevron}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>ASSIGN TO</div>

          {team?.map((member) => {
            const isActive = assignedTo === member.name
            return (
              <button
                key={member.id}
                className={cn(styles.option, isActive && styles.optionActive)}
                onClick={() => handleAssign(member.name)}
              >
                <div className={styles.optionAvatar}>
                  {getInitials(member.name)}
                </div>
                {member.name}
                <span className={styles.optionRole}>{member.role}</span>
                {isActive && <span className={styles.checkmark}>✓</span>}
              </button>
            )
          })}

          <div className={styles.divider} />

          <button
            className={styles.unassignOption}
            onClick={() => handleAssign(null)}
          >
            Remove assignment
          </button>
        </div>
      )}
    </div>
  )
}