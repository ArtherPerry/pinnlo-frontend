'use client'

import { useGenerateReplySuggestions } from '@/hooks/useAI'
import { useToast } from '@/hooks/useToast'
import styles from './ReplySuggestions.module.css'
import { Sparkles } from 'lucide-react'

interface ReplySuggestionsProps {
  message:  string   // the customer's last message
  platform: string
  threadId: string
  onUse:    (suggestion: string) => void
}

export function ReplySuggestions({
  message,
  platform,
  threadId,
  onUse,
}: ReplySuggestionsProps) {
  const generate = useGenerateReplySuggestions()
  const toast    = useToast()

  const handleGenerate = async () => {
    if (!message.trim()) return
    try {
      await generate.mutateAsync({ message, platform, threadId })
    } catch {
      toast.show('Failed to generate suggestions', 'error')
    }
  }

  // Show just the trigger button before generating
  if (!generate.data && !generate.isPending && !generate.isError) {
    return (
      <button
        className={styles.triggerBtn}
        onClick={handleGenerate}
        disabled={!message.trim()}
      >
        <Sparkles size={14} /> Suggest replies
      </button>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span>✨</span>
        <span>AI reply suggestions</span>
        <span className={styles.aiBadge}>Claude AI</span>
        {!generate.isPending && (
          <button
            className={styles.triggerBtn}
            style={{ marginLeft: 'auto' }}
            onClick={handleGenerate}
          >
            Regenerate
          </button>
        )}
        <button
    onClick={() => generate.reset()}
    style={{
      width: 22,
      height: 22,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--color-muted)',
      fontSize: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-sm)',
      flexShrink: 0,
    }}
    title="Dismiss suggestions"
  >
    ×
  </button>
      </div>

      {/* Loading */}
      {generate.isPending && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Generating suggestions...</span>
        </div>
      )}

      {/* Error */}
      {generate.isError && (
        <div className={styles.error}>
          Failed to generate suggestions — try again.
        </div>
      )}

      {/* Suggestions */}
      {generate.data?.suggestions && (
        <div className={styles.suggestions}>
          {generate.data.suggestions.map((suggestion, i) => (
            <button
              key={i}
              className={styles.suggestion}
              onClick={() => onUse(suggestion)}
            >
              <span className={styles.suggestionNum}>{i + 1}</span>
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}