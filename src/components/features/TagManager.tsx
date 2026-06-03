'use client'

import { useState, useRef, useEffect } from 'react'
import { useAddTag, useRemoveTag } from '@/hooks/useContacts'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import styles from './TagManager.module.css'

// All known tags across the product
const KNOWN_TAGS = [
  'vip', 'interested', 'corporate', 'follow-up',
  'new', 'closed', 'pending', 'hot-lead', 'cold',
]

interface TagManagerProps {
  contactId: string
  tags:      string[]
}

export function TagManager({ contactId, tags }: TagManagerProps) {
  const [input,       setInput      ] = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const inputRef                      = useRef<HTMLInputElement>(null)

  const addTag    = useAddTag(contactId)
  const removeTag = useRemoveTag(contactId)
  const toast     = useToast()

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('.suggestions-wrapper')?.contains(e.target as Node)) {
        setShowSuggest(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = KNOWN_TAGS.filter((t) =>
    t.includes(input.toLowerCase()) && t !== input.toLowerCase()
  )

  const handleAdd = async (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (!clean) return
    if (tags.includes(clean)) {
      toast.show(`Tag "${clean}" already added`, 'warning')
      return
    }

    try {
      await addTag.mutateAsync(clean)
      setInput('')
      setShowSuggest(false)
      toast.show(`Tag "${clean}" added ✓`, 'success')
    } catch {
      toast.show('Failed to add tag', 'error')
    }
  }

  const handleRemove = async (tag: string) => {
    try {
      await removeTag.mutateAsync(tag)
      toast.show(`Tag "${tag}" removed`, 'info')
    } catch {
      toast.show('Failed to remove tag', 'error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd(input)
    }
    if (e.key === 'Escape') {
      setShowSuggest(false)
      setInput('')
    }
  }

  return (
    <div className={styles.wrapper}>

      {/* Current tags */}
      <div className={styles.tagList}>
        {tags.length === 0 && (
          <span className={styles.noTags}>No tags yet — add one below</span>
        )}
        {tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              className={styles.removeTag}
              onClick={() => handleRemove(tag)}
              disabled={removeTag.isPending}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input row */}
      <div className={cn(styles.inputRow, 'suggestions-wrapper')}>
        <input
          ref={inputRef}
          type="text"
          className={styles.tagInput}
          placeholder="Add tag... (e.g. vip)"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggest(true)
          }}
          onFocus={() => setShowSuggest(true)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={styles.addBtn}
          onClick={() => handleAdd(input)}
          disabled={!input.trim() || addTag.isPending}
        >
          {addTag.isPending ? '...' : '+ Add'}
        </button>

        {/* Suggestions dropdown */}
        {showSuggest && input.length > 0 && filtered.length > 0 && (
          <div className={styles.suggestions}>
            {filtered.slice(0, 5).map((suggestion) => {
              const alreadyAdded = tags.includes(suggestion)
              return (
                <button
                  key={suggestion}
                  className={styles.suggestion}
                  onClick={() => {
                    if (!alreadyAdded) handleAdd(suggestion)
                  }}
                  disabled={alreadyAdded}
                >
                  {suggestion}
                  {alreadyAdded && (
                    <span className={styles.suggestionAlready}>
                      already added
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Show all suggestions when input is empty and focused */}
        {showSuggest && input.length === 0 && (
          <div className={styles.suggestions}>
            {KNOWN_TAGS.filter((t) => !tags.includes(t))
              .slice(0, 6)
              .map((suggestion) => (
                <button
                  key={suggestion}
                  className={styles.suggestion}
                  onClick={() => handleAdd(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}