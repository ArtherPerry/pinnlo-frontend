'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, PlatformIcon, MediaUpload } from '@/components/ui'
import { useClients } from '@/hooks/useClients'
import { useCreatePost } from '@/hooks/usePosts'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/types'
import styles from './NewPostModal.module.css'
import { CaptionGenerator } from './CaptionGenerator'
import { ImageGenerator } from './ImageGenerator'

const PLATFORMS: Platform[] = ['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'LINE']

const PLATFORM_CHAR_LIMIT: Record<Platform, number> = {
  FACEBOOK:  63206,
  INSTAGRAM: 2200,
  WHATSAPP:  4096,
  LINE:      5000,
}

const schema = z.object({
  clientId:    z.string().min(1, 'Select a client'),
  platforms:   z.array(z.string()).min(1, 'Select at least one platform'),
  content:     z.string().min(1, 'Write some content').max(63206, 'Content too long'),
  scheduledAt: z.string().min(1, 'Set a schedule date and time'),
  labels:      z.string(),
})

type FormValues = z.infer<typeof schema>

interface NewPostModalProps {
  onClose: () => void
}

export function NewPostModal({ onClose }: NewPostModalProps) {
  const { data: clients, isLoading: clientsLoading } = useClients()
  const createPost = useCreatePost()
  const toast      = useToast()

  const [mediaFiles, setMediaFiles] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId:    '',
      platforms:   [],
      content:     '',
      scheduledAt: '',
      labels:      '',
    },
  })

  const content   = watch('content')
  const platforms = watch('platforms') as Platform[]

  // Smallest limit among selected platforms
  const charLimit = platforms.length > 0
    ? Math.min(...platforms.map((p) => PLATFORM_CHAR_LIMIT[p]))
    : 63206

  const charLeft    = charLimit - content.length
  const charWarning = charLeft < 100
  const charError   = charLeft < 0

  const togglePlatform = (platform: Platform) => {
    const current = platforms
    const next = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform]
    setValue('platforms', next, { shouldValidate: true })
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await createPost.mutateAsync({
        clientId:    values.clientId,
        content:     values.content,
        platforms:   values.platforms as Platform[],
        scheduledAt: values.scheduledAt,
        labels:      values.labels
          ? values.labels.split(',').map((l) => l.trim()).filter(Boolean)
          : [],
        mediaIds: mediaFiles.map((f) => f.id),
      } as any)
      toast.show('Post scheduled ✓', 'success')
      onClose()
    } catch {
      toast.show('Failed to create post', 'error')
    }
  }
  const [showAI, setShowAI] = useState(false)
  const [showImageAI, setShowImageAI] = useState(false)

  // Min datetime = now + 5 minutes
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>New post</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.body}>

            {/* ── Client ── */}
            <div>
              <span className={styles.sectionLabel}>Client workspace</span>
              {clientsLoading ? (
                <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
                  Loading clients...
                </p>
              ) : (
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <div className={styles.clientGrid}>
                      {clients?.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className={cn(
                            styles.clientOption,
                            field.value === client.id && styles.clientOptionActive
                          )}
                          onClick={() => field.onChange(client.id)}
                        >
                          <span className={styles.clientDot} />
                          {client.name}
                        </button>
                      ))}
                    </div>
                  )}
                />
              )}
              {errors.clientId && (
                <p className={styles.formError} style={{ marginTop: '8px' }}>
                  {errors.clientId.message}
                </p>
              )}
            </div>

            {/* ── Platforms ── */}
            <div>
              <span className={styles.sectionLabel}>Publish to</span>
              <div className={styles.platformGrid}>
                {PLATFORMS.map((platform) => {
                  const selected = platforms.includes(platform)
                  return (
                    <button
                      key={platform}
                      type="button"
                      className={cn(
                        styles.platformOption,
                        selected && styles.platformOptionActive
                      )}
                      onClick={() => togglePlatform(platform)}
                    >
                      <PlatformIcon platform={platform} size={16} />
                      {platform.charAt(0) + platform.slice(1).toLowerCase()}
                    </button>
                  )
                })}
              </div>
              {errors.platforms && (
                <p className={styles.formError} style={{ marginTop: '8px' }}>
                  {errors.platforms.message}
                </p>
              )}
            </div>

            {/* ── Content ── */}
<div>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-2)',
  }}>
    <span className={styles.sectionLabel} style={{ margin: 0 }}>
      Content
    </span>
    <button
      type="button"
      onClick={() => setShowAI((v) => !v)}
      style={{
        fontSize: 'var(--text-small)',
        fontWeight: 500,
        color: showAI ? 'var(--color-white)' : 'var(--color-teal-600)',
        border: '0.5px solid var(--color-teal-500)',
        background: showAI ? 'var(--color-teal-500)' : 'var(--color-teal-50)',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all var(--transition-fast)',
      }}
    >
      ✨ {showAI ? 'Hide AI' : 'AI caption'}
    </button>
  </div>

  {/* AI caption generator */}
  {showAI && (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <CaptionGenerator
        platform={platforms[0] ?? 'ALL'}
        clientName={
          clients?.find((c) => c.id === watch('clientId'))?.name
        }
        onUse={(caption) => {
          setValue('content', caption, { shouldValidate: true })
          setShowAI(false)
        }}
        onClose={() => setShowAI(false)}
      />
    </div>
  )}

  <div className={styles.contentWrapper}>
    <textarea
      className={styles.textarea}
      placeholder="Write your post content here..."
      {...register('content')}
    />
    <span className={cn(
      styles.charCount,
      charWarning && styles.charCountWarning,
      charError   && styles.charCountError,
    )}>
      {charLeft.toLocaleString()}
    </span>
  </div>
  {errors.content && (
    <p className={styles.formError} style={{ marginTop: '8px' }}>
      {errors.content.message}
    </p>
  )}
</div>

            {/* ── Media ── */}
<div>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-2)',
  }}>
    <span className={styles.sectionLabel} style={{ margin: 0 }}>
      Media (optional)
    </span>
    <button
      type="button"
      onClick={() => setShowImageAI((v) => !v)}
      style={{
        fontSize: 'var(--text-small)',
        fontWeight: 500,
        color: showImageAI ? 'white' : '#534AB7',
        border: '0.5px solid #7F77DD',
        background: showImageAI ? '#534AB7' : '#EEEDFE',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all var(--transition-fast)',
      }}
    >
      🎨 {showImageAI ? 'Hide AI' : 'AI image'}
    </button>
  </div>

  {/* AI image generator */}
  {showImageAI && (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <ImageGenerator
        platform={platforms[0] ?? 'ALL'}
        onUse={(image) => {
          // Add generated image URL to media files
          setMediaFiles((prev) => [
            ...prev,
            {
              id:        image.id,
              url:       image.url,
              mimeType:  'image/jpeg',
              sizeBytes: 0,
              localUrl:  image.url,
              name:      'AI generated image',
            },
          ])
          setShowImageAI(false)
          toast.show('AI image added to post ✓', 'success')
        }}
        onClose={() => setShowImageAI(false)}
      />
    </div>
  )}

  <MediaUpload
    label=""
    maxFiles={4}
    maxSizeMB={10}
    onChange={(files) => setMediaFiles(files)}
  />
</div>

            {/* ── Schedule ── */}
            <div>
              <span className={styles.sectionLabel}>Schedule</span>
              <div className={styles.scheduleRow}>
                <Input
                  label="Date & time"
                  type="datetime-local"
                  min={minDateTime}
                  error={errors.scheduledAt?.message}
                  {...register('scheduledAt')}
                />
                <Input
                  label="Labels (comma separated)"
                  type="text"
                  placeholder="promotion, food, sale"
                  hint="Used for filtering and reporting"
                  {...register('labels')}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={charError}
            >
              Schedule post
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}