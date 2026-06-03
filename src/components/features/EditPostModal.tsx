'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, PlatformIcon, Badge } from '@/components/ui'
import { useEditPost } from '@/hooks/usePosts'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { Post, Platform } from '@/lib/types'
import styles from './EditPostModal.module.css'

const PLATFORMS: Platform[] = ['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'LINE']

const PLATFORM_CHAR_LIMIT: Record<Platform, number> = {
  FACEBOOK:  63206,
  INSTAGRAM: 2200,
  WHATSAPP:  4096,
  LINE:      5000,
}

const STATUS_BADGE: Record<string, Parameters<typeof Badge>[0]['variant']> = {
  DRAFT:    'draft',
  FAILED:   'failed',
  SCHEDULED:'scheduled',
}

const schema = z.object({
  platforms:   z.array(z.string()).min(1, 'Select at least one platform'),
  content:     z.string().min(1, 'Write some content').max(63206, 'Content too long'),
  scheduledAt: z.string().min(1, 'Set a schedule date and time'),
  labels:      z.string(),
})

type FormValues = z.infer<typeof schema>

interface EditPostModalProps {
  post:    Post
  onClose: () => void
}

export function EditPostModal({ post, onClose }: EditPostModalProps) {
  const editPost = useEditPost(post.id)
  const toast    = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      platforms:   post.platforms,
      content:     post.content,
      scheduledAt: post.scheduledAt
        ? new Date(post.scheduledAt).toISOString().slice(0, 16)
        : '',
      labels: post.labels.join(', '),
    },
  })

  const content   = watch('content')
  const platforms = watch('platforms') as Platform[]

  const charLimit = platforms.length > 0
    ? Math.min(...platforms.map((p) => PLATFORM_CHAR_LIMIT[p]))
    : 63206

  const charLeft    = charLimit - content.length
  const charWarning = charLeft < 100
  const charError   = charLeft < 0

  const togglePlatform = (platform: Platform) => {
    const next = platforms.includes(platform)
      ? platforms.filter((p) => p !== platform)
      : [...platforms, platform]
    setValue('platforms', next, { shouldValidate: true })
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await editPost.mutateAsync({
        clientId:    post.clientId,
        content:     values.content,
        platforms:   values.platforms as Platform[],
        scheduledAt: values.scheduledAt,
        labels:      values.labels
          ? values.labels.split(',').map((l) => l.trim()).filter(Boolean)
          : [],
      })
      toast.show('Post updated ✓', 'success')
      onClose()
    } catch {
      toast.show('Failed to update post', 'error')
    }
  }

  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>Edit post</span>
            <Badge variant={STATUS_BADGE[post.status] ?? 'neutral'}>
              {post.status}
            </Badge>
          </div>
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

            {/* ── Client info (read-only) ── */}
            <div>
              <span className={styles.sectionLabel}>Client</span>
              <p style={{
                fontSize: 'var(--text-body)',
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}>
                {post.clientName}
              </p>
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
                <p className={styles.formError}>{errors.platforms.message}</p>
              )}
            </div>

            {/* ── Content ── */}
            <div>
              <span className={styles.sectionLabel}>Content</span>
              <div className={styles.contentWrapper}>
                <textarea
                  className={styles.textarea}
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
                <p className={styles.formError}>{errors.content.message}</p>
              )}
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
                  {...register('labels')}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.statusNote}>
              {isDirty && (
                <>
                  <span className={styles.statusDot} />
                  Unsaved changes
                </>
              )}
            </div>
            <div className={styles.footerRight}>
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
                disabled={charError || !isDirty}
              >
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}