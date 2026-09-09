'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, PlatformIcon, MediaUpload } from '@/components/ui'
import { useClients } from '@/hooks/useClients'
import { useCreatePost, useSubmitPost } from '@/hooks/usePosts'
import { useToast } from '@/hooks/useToast'
import { cn, apiErrorMessage } from '@/lib/utils'
import { FEATURES, ENABLED_PLATFORMS } from '@/lib/features'
import type { Platform } from '@/lib/types'
import type { MediaAsset } from '@/hooks/useMedia'
import styles from './NewPostModal.module.css'
import { CaptionGenerator } from './CaptionGenerator'
import { ImageGenerator } from './ImageGenerator'
import { AIReview } from './AIReview'
import { Sparkles, Info, Send, FileText } from 'lucide-react'

/**
 * Only limits that actually bind are shown. Facebook's 63,206 is never the
 * constraint in practice, so surfacing it as a countdown on an empty field
 * was noise.
 */
const PLATFORM_CHAR_LIMIT: Partial<Record<Platform, number>> = {
  INSTAGRAM: 2200,
  WHATSAPP:  4096,
  LINE:      5000,
}

const HARD_MAX = 63206

const schema = z.object({
  clientId:  z.string().min(1, 'Select a client'),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  content:   z.string().min(1, 'Write some content').max(HARD_MAX, 'Content too long'),
  // Optional: a draft does not need a time yet. If set, the post schedules
  // itself the moment the client approves.
  scheduledAt: z.string().optional(),
  labels:      z.string(),
})

type FormValues = z.infer<typeof schema>

interface NewPostModalProps {
  onClose: () => void
}

export function NewPostModal({ onClose }: NewPostModalProps) {
  const { data: clients, isLoading: clientsLoading } = useClients()
  const createPost = useCreatePost()
  const submitPost = useSubmitPost()
  const toast      = useToast()

  const [mediaFiles,  setMediaFiles ] = useState<MediaAsset[]>([])
  const [showCaption, setShowCaption] = useState(false)
  const [showImageAI, setShowImageAI] = useState(false)
  const [showReview,  setShowReview ] = useState(false)

  // Which button was pressed. A ref, not state: onSubmit is a closure captured
  // at render time, so a state update from onClick would not be visible to it.
  const actionRef = useRef<'draft' | 'submit'>('draft')
  const [activeAction, setActiveAction] = useState<'draft' | 'submit' | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '', platforms: [], content: '', scheduledAt: '', labels: '',
    },
  })

  const content    = watch('content') ?? ''
  const platforms  = watch('platforms') as Platform[]
  const clientId   = watch('clientId')
  const clientName = clients?.find((c) => c.id === clientId)?.name

  // Media is scoped to a workspace, so changing workspace invalidates whatever
  // is attached. Clearing here avoids a confusing "media could not be found"
  // rejection at save time.
  useEffect(() => {
    setMediaFiles([])
  }, [clientId])

  // Only show a counter when a selected platform actually has a tight limit.
  const limits    = platforms.map((p) => PLATFORM_CHAR_LIMIT[p]).filter(Boolean) as number[]
  const charLimit = limits.length > 0 ? Math.min(...limits) : null
  const charLeft  = charLimit !== null ? charLimit - content.length : null
  const charError = charLeft !== null && charLeft < 0

  const togglePlatform = (platform: Platform) => {
    const next = platforms.includes(platform)
      ? platforms.filter((p) => p !== platform)
      : [...platforms, platform]
    setValue('platforms', next, { shouldValidate: true })
  }

  const onSubmit = async (values: FormValues) => {
    const action = actionRef.current
    try {
      const created = await createPost.mutateAsync({
        clientId:    values.clientId,
        content:     values.content,
        platforms:   values.platforms as Platform[],
                // datetime-local gives "2026-09-09T09:45" — no seconds, no timezone.
        // Instant.parse needs a full ISO instant, and treating the bare string
        // as UTC would schedule a 09:45 Bangkok post for 16:45 local.
        scheduledAt: values.scheduledAt
          ? new Date(values.scheduledAt).toISOString()
          : null,
        labels: values.labels
          ? values.labels.split(',').map((l) => l.trim()).filter(Boolean)
          : [],
        mediaIds: mediaFiles.map((f) => f.id),
      })

      if (action === 'submit') {
        await submitPost.mutateAsync(created.id)
        toast.show('Sent for internal review', 'success')
      } else {
        toast.show('Draft saved', 'success')
      }
      onClose()
    } catch (error) {
      toast.show(apiErrorMessage(error, 'Could not save this post'), 'error')
    } finally {
      setActiveAction(null)
    }
  }

  const isSaving    = createPost.isPending || submitPost.isPending
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.headerTitle}>New post</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
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
                <p className={styles.formError} style={{ marginTop: 8 }}>
                  {errors.clientId.message}
                </p>
              )}
            </div>

            {/* ── Platforms ── */}
            <div>
              <span className={styles.sectionLabel}>Publish to</span>
              <div className={styles.platformRow}>
                {ENABLED_PLATFORMS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    className={cn(
                      styles.platformOption,
                      platforms.includes(platform) && styles.platformOptionActive
                    )}
                    onClick={() => togglePlatform(platform)}
                  >
                    <PlatformIcon platform={platform} size={16} />
                    {platform.charAt(0) + platform.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {errors.platforms && (
                <p className={styles.formError} style={{ marginTop: 8 }}>
                  {errors.platforms.message}
                </p>
              )}
            </div>

            {/* ── Content ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className={styles.sectionLabel} style={{ margin: 0 }}>Content</span>

                <div style={{ display: 'flex', gap: 8 }}>
                  {FEATURES.aiCaption && (
                    <button
                      type="button"
                      className={styles.aiToggle}
                      onClick={() => setShowCaption((v) => !v)}
                    >
                      <Sparkles size={14} /> {showCaption ? 'Hide AI' : 'AI caption'}
                    </button>
                  )}

                  {FEATURES.aiReview && (
                    <button
                      type="button"
                      className={styles.aiToggle}
                      onClick={() => setShowReview((v) => !v)}
                      disabled={!content.trim()}
                      title={!content.trim() ? 'Write some content first' : undefined}
                    >
                      <Sparkles size={14} /> {showReview ? 'Hide review' : 'AI review'}
                    </button>
                  )}
                </div>
              </div>

              {FEATURES.aiCaption && showCaption && (
                <div style={{ marginBottom: 12 }}>
                  <CaptionGenerator
                    platform={platforms[0] ?? 'FACEBOOK'}
                    clientName={clientName}
                    onUse={(caption) => {
                      setValue('content', caption, { shouldValidate: true })
                      setShowCaption(false)
                    }}
                    onClose={() => setShowCaption(false)}
                  />
                </div>
              )}

              <textarea
                className={styles.textarea}
                placeholder="Write your post content here..."
                rows={6}
                {...register('content')}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {errors.content
                  ? <p className={styles.formError}>{errors.content.message}</p>
                  : <span />}
                {charLeft !== null && (
                  <span style={{
                    fontSize: 'var(--text-small)',
                    color: charError ? 'var(--color-danger)' : 'var(--color-muted)',
                  }}>
                    {charLeft} left
                  </span>
                )}
              </div>

              {/* Optional AI review — never blocks saving */}
              {FEATURES.aiReview && showReview && content.trim() && (
                <div style={{ marginTop: 12 }}>
                  {FEATURES.aiReviewIsPreview && (
                    <div className={styles.previewNote}>
                      <Info size={14} />
                      <span>
                        Preview feature — this is sample output to show the format.
                        Real recommendations arrive with Annovist Intelligence.
                      </span>
                    </div>
                  )}
                  <AIReview
                    content={content}
                    clientName={clientName}
                    hasMedia={mediaFiles.length > 0}
                  />
                </div>
              )}
            </div>

            {/* ── Media ── */}
            {FEATURES.mediaUpload && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className={styles.sectionLabel} style={{ margin: 0 }}>Media (optional)</span>
                  {FEATURES.aiImage && (
                    <button type="button" className={styles.aiToggle} onClick={() => setShowImageAI((v) => !v)}>
                      <Sparkles size={14} /> {showImageAI ? 'Hide AI' : 'AI image'}
                    </button>
                  )}
                </div>

                {FEATURES.aiImage && showImageAI && (
                  <ImageGenerator
                    platform={platforms[0]}
                    onUse={() => setShowImageAI(false)}
                    onClose={() => setShowImageAI(false)}
                  />
                )}

                <MediaUpload
                  label=""
                  clientId={clientId || null}
                  platforms={platforms}
                  value={mediaFiles}
                  onChange={setMediaFiles}
                />
              </div>
            )}

            {/* ── Schedule ── */}
            <div>
              <span className={styles.sectionLabel}>Schedule</span>
              <div className={styles.scheduleRow}>
                <Input
                  label="Date & time (optional)"
                  type="datetime-local"
                  min={minDateTime}
                  {...register('scheduledAt')}
                />
                <Input
                  label="Labels (comma separated)"
                  placeholder="promotion, food, sale"
                  {...register('labels')}
                />
              </div>
              <p className={styles.fieldHint}>
                If you set a time now, the post schedules itself as soon as the client
                approves. You can also add it later.
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className={styles.footerColumn}>
            <p className={styles.workflowHint}>
              <Info size={13} />
              {clientName
                ? <>Drafts go to internal review first, then to <strong>{clientName}</strong> for approval.</>
                : <>Drafts go to internal review first, then to the client for approval.</>}
            </p>

            <div className={styles.footer}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                loading={isSaving && activeAction === 'draft'}
                disabled={isSaving || charError}
                onClick={() => { actionRef.current = 'draft'; setActiveAction('draft') }}
              >
                <FileText size={15} /> Save as draft
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving && activeAction === 'submit'}
                disabled={isSaving || charError}
                onClick={() => { actionRef.current = 'submit'; setActiveAction('submit') }}
              >
                <Send size={15} /> Save &amp; submit for review
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}