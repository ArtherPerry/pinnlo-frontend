'use client'

import { useState } from 'react'
import { useGenerateImages } from '@/hooks/useAI'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import styles from './ImageGenerator.module.css'
import { Check } from 'lucide-react'

const STYLES = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'illustration',   label: 'Illustration'   },
  { value: 'minimal',        label: 'Minimal'        },
  { value: 'vibrant',        label: 'Vibrant'        },
  { value: 'food',           label: 'Food & product' },
]

interface GeneratedImage {
  id:     string
  url:    string
  prompt: string
}

interface ImageGeneratorProps {
  platform?: string
  onUse:     (image: GeneratedImage) => void
  onClose:   () => void
}

export function ImageGenerator({ platform, onUse, onClose }: ImageGeneratorProps) {
  const [prompt,      setPrompt     ] = useState('')
  const [style,       setStyle      ] = useState('photorealistic')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const generate = useGenerateImages()
  const toast    = useToast()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.show('Describe the image you want', 'warning')
      return
    }
    setSelectedIdx(null)
    try {
      await generate.mutateAsync({
        prompt,
        style,
        platform: platform || 'ALL',
      })
    } catch {
      toast.show('Failed to generate images — try again', 'error')
    }
  }

  const handleUse = () => {
    if (selectedIdx === null || !generate.data?.images) return
    onUse(generate.data.images[selectedIdx])
  }

  return (
    <div className={styles.panel}>

      {/* Header */}
      <div className={styles.header}>
        <span>🎨</span>
        <span className={styles.headerTitle}>AI image generation</span>
        <span className={styles.aiBadge}>Agency+</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.body}>

        {/* Prompt */}
        <textarea
          className={styles.promptInput}
          placeholder="Describe the image... e.g. A warm coffee shop interior with wooden tables, morning light, Thai style decoration"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />

        {/* Style selector */}
        <div>
          <div style={{
            fontSize: 'var(--text-small)',
            fontWeight: 600,
            color: 'var(--color-ink)',
            marginBottom: 'var(--space-2)',
          }}>
            Image style
          </div>
          <div className={styles.styleGrid}>
            {STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                className={cn(
                  styles.styleBtn,
                  style === s.value && styles.styleBtnActive
                )}
                onClick={() => setStyle(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={generate.isPending || !prompt.trim()}
        >
          {generate.isPending ? (
            <>
              <div className={styles.spinner} />
              Generating images...
            </>
          ) : (
            '🎨 Generate 3 images'
          )}
        </button>

        {/* Loading */}
        {generate.isPending && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Creating images — this takes a moment...</span>
          </div>
        )}

        {/* Error */}
        {generate.isError && (
          <div className={styles.error}>
            Failed to generate images. Please try again.
          </div>
        )}

        {/* Image grid */}
        {generate.data?.images && generate.data.images.length > 0 && (
          <>
            <div className={styles.imageGrid}>
              {generate.data.images.map((img, i) => (
                <div
                  key={img.id}
                  className={cn(
                    styles.imageOption,
                    selectedIdx === i && styles.imageOptionSelected
                  )}
                  onClick={() => setSelectedIdx(i)}
                >
                  <img
                    src={img.url}
                    alt={`Generated image ${i + 1}`}
                    className={styles.imagePreview}
                  />
                  <div className={styles.imageOverlay}>
                    <div className={styles.selectedTick}><Check size={14} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.useRow}>
              <button
                className={styles.useBtn}
                onClick={handleUse}
                disabled={selectedIdx === null}
              >
                {selectedIdx !== null
                  ? `Use image ${selectedIdx + 1}`
                  : 'Select an image'
                }
              </button>
            </div>
          </>
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