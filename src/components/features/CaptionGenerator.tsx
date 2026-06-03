'use client'

import { useState } from 'react'
import { useGenerateCaptions } from '@/hooks/useAI'
import { useToast } from '@/hooks/useToast'
import styles from './CaptionGenerator.module.css'

const TONES = [
  { value: 'casual',        label: 'Casual'        },
  { value: 'professional',  label: 'Professional'  },
  { value: 'promotional',   label: 'Promotional'   },
  { value: 'humorous',      label: 'Humorous'      },
  { value: 'inspirational', label: 'Inspirational' },
]

const CAPTION_ANGLE = [
  'Informative angle',
  'Storytelling angle',
  'Promotional angle',
]

interface CaptionGeneratorProps {
  platform:    string
  clientName?: string
  onUse:       (caption: string) => void
  onClose:     () => void
}

export function CaptionGenerator({
  platform,
  clientName,
  onUse,
  onClose,
}: CaptionGeneratorProps) {
  const [topic,    setTopic   ] = useState('')
  const [tone,     setTone    ] = useState('casual')
  const [language, setLanguage] = useState('th')

  const generate = useGenerateCaptions()
  const toast    = useToast()

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.show('Describe what the post is about', 'warning')
      return
    }
    try {
      await generate.mutateAsync({
        topic,
        platform: platform || 'ALL',
        tone,
        language,
        clientName,
      })
    } catch {
      toast.show('Failed to generate captions — try again', 'error')
    }
  }

  return (
    <div className={styles.panel}>

      {/* Header */}
      <div className={styles.header}>
        <span>✨</span>
        <span className={styles.headerTitle}>AI caption generator</span>
        <span className={styles.aiBadge}>Claude AI</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.body}>

        {/* Topic input */}
        <input
          type="text"
          className={styles.topicInput}
          placeholder="What is this post about? e.g. 20% off promotion this weekend"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />

        {/* Controls */}
        <div className={styles.controlRow}>
          <select
            className={styles.select}
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            className={styles.select}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="th">Thai</option>
            <option value="en">English</option>
            <option value="my">Burmese</option>
            <option value="lo">Lao</option>
          </select>
        </div>

        {/* Generate button */}
        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={generate.isPending || !topic.trim()}
        >
          {generate.isPending ? (
            <>
              <div className={styles.spinner} />
              Claude is writing...
            </>
          ) : (
            '✨ Generate 3 captions'
          )}
        </button>

        {/* Loading state */}
        {generate.isPending && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Generating captions for {platform || 'all platforms'}...</span>
          </div>
        )}

        {/* Error */}
        {generate.isError && (
          <div className={styles.error}>
            Failed to generate captions. Please try again.
          </div>
        )}

        {/* Caption results */}
        {generate.data?.captions && generate.data.captions.length > 0 && (
          <div className={styles.captionList}>
            {generate.data.captions.map((caption, i) => (
              <button
                key={i}
                className={styles.captionOption}
                onClick={() => onUse(caption)}
              >
                <span className={styles.captionNum}>
                  Option {i + 1} — {CAPTION_ANGLE[i] ?? 'Variation'}
                </span>
                <span className={styles.captionText}>{caption}</span>
                <div className={styles.captionFooter}>
                  <span>{caption.length} characters</span>
                  <span className={styles.useHint}>Use this caption →</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Usage footer */}
        {generate.data?.usageRemaining !== undefined && (
          <div className={styles.footer}>
            {generate.data.usageRemaining} generations remaining this month
          </div>
        )}

      </div>
    </div>
  )
}