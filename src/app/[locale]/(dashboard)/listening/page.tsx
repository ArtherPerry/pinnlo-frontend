'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useListeningQueries,
  useMentions,
  useCreateListeningQuery,
  useDeleteListeningQuery,
  useUpdateListeningQuery,
} from '@/hooks/useEnterprise'
import { Button, Input, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { PlanGate } from '@/components/features/PlanGate'
import type {
  ListeningQuery,
  Mention,
  ListeningPlatform,
  AlertFrequency,
  SentimentType,
} from '@/lib/types'
import styles from './listening.module.css'

type PlatformIconPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP' | 'LINE'

const PLATFORMS: ListeningPlatform[] = ['FACEBOOK', 'INSTAGRAM']

const SENTIMENT_LABEL: Record<SentimentType, string> = {
  POSITIVE: 'Positive',
  NEUTRAL:  'Neutral',
  NEGATIVE: 'Negative',
}

const SENTIMENT_PILL_CLASS: Record<SentimentType, string> = {
  POSITIVE: styles.sentPillPos,
  NEUTRAL:  styles.sentPillNeu,
  NEGATIVE: styles.sentPillNeg,
}

const schema = z.object({
  keyword:        z.string().min(2, 'Keyword must be at least 2 characters'),
  platforms:      z.array(z.string()).min(1, 'Select at least one platform'),
  language:       z.enum(['th', 'en', 'my', 'lo']),
  alertEnabled:   z.boolean(),
  alertFrequency: z.enum(['REALTIME', 'DAILY', 'WEEKLY']),
})

type FormValues = z.infer<typeof schema>

function AddQueryModal({ onClose }: { onClose: () => void }) {
  const createQuery = useCreateListeningQuery()
  const toast       = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      keyword:        '',
      platforms:      ['FACEBOOK'],
      language:       'th',
      alertEnabled:   true,
      alertFrequency: 'DAILY',
    },
  })

  const platforms    = watch('platforms') as ListeningPlatform[]
  const alertEnabled = watch('alertEnabled')

  const togglePlatform = (p: ListeningPlatform) => {
    const next = platforms.includes(p)
      ? platforms.filter((x) => x !== p)
      : [...platforms, p]
    setValue('platforms', next, { shouldValidate: true })
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await createQuery.mutateAsync({
        keyword:        values.keyword,
        platforms:      values.platforms as ListeningPlatform[],
        language:       values.language,
        alertEnabled:   values.alertEnabled,
        alertFrequency: values.alertFrequency as AlertFrequency,
      })
      toast.show('Keyword added ✓', 'success')
      onClose()
    } catch {
      toast.show('Failed to add keyword', 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Monitor a keyword</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.modalBody}>
            <Input
              label="Keyword or brand name"
              placeholder="Somjai Coffee"
              required
              hint="Can be in Thai, English, Burmese, or Lao"
              error={errors.keyword?.message}
              {...register('keyword')}
            />

            <div>
              <span className={styles.sectionLabel}>Platforms to monitor</span>
              <div className={styles.platformGrid}>
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={cn(
                      styles.platformOption,
                      platforms.includes(p) && styles.platformOptionActive
                    )}
                    onClick={() => togglePlatform(p)}
                  >
                    <PlatformIcon platform={p as PlatformIconPlatform} size={13} />
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {errors.platforms && (
                <p className={styles.formError}>{errors.platforms.message}</p>
              )}
            </div>

            <div>
              <span className={styles.sectionLabel}>Content language</span>
              <select
                style={{
                  width: '100%', height: '36px',
                  padding: '0 var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-sans)',
                }}
                {...register('language')}
              >
                <option value="th">Thai (ภาษาไทย)</option>
                <option value="en">English</option>
                <option value="my">Burmese (မြန်မာ)</option>
                <option value="lo">Lao (ພາສາລາວ)</option>
              </select>
            </div>

            <div className={styles.alertRow}>
              <div className={styles.alertRowLeft}>
                <span className={styles.alertRowTitle}>Enable alerts</span>
                <span className={styles.alertRowSub}>
                  Get notified when new mentions are found
                </span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" {...register('alertEnabled')} />
                <div className={styles.toggleTrack} />
                <div className={styles.toggleThumb} />
              </label>
            </div>

            {alertEnabled && (
              <div>
                <span className={styles.sectionLabel}>Alert frequency</span>
                <select
                  style={{
                    width: '100%', height: '36px',
                    padding: '0 var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-body)',
                    background: 'var(--color-white)',
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-sans)',
                  }}
                  {...register('alertFrequency')}
                >
                  <option value="REALTIME">Real-time</option>
                  <option value="DAILY">Daily digest</option>
                  <option value="WEEKLY">Weekly summary</option>
                </select>
              </div>
            )}
          </div>
          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Start monitoring
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MentionCard({ mention }: { mention: Mention }) {
  const initials = mention.author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={styles.mentionCard}>
      <div className={styles.mentionHeader}>
        <div className={styles.mentionAuthor}>
          <div className={styles.authorAvatar}>{initials}</div>
          <div className={styles.authorName}>{mention.author}</div>
        </div>
        <div className={styles.mentionRight}>
          <span className={cn(styles.sentimentPill, SENTIMENT_PILL_CLASS[mention.sentiment])}>
            {SENTIMENT_LABEL[mention.sentiment]}
          </span>
          <PlatformIcon platform={mention.platform as PlatformIconPlatform} size={14} />
        </div>
      </div>

      <p className={styles.mentionContent}>{mention.content}</p>

      <div className={styles.mentionFooter}>
        <div className={styles.mentionStats}>
          <span>👍 {mention.engagement.toLocaleString()}</span>
          <span>
            {new Date(mention.foundAt).toLocaleDateString('th-TH', {
              dateStyle: 'medium',
              timeStyle: 'short',
            } as Intl.DateTimeFormatOptions)}
          </span>
        </div>
        <a
          href={mention.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mentionLink}
        >
          View post ↗
        </a>
      </div>
    </div>
  )
}

function QueryCard({
  query,
  isActive,
  onClick,
}: {
  query:    ListeningQuery
  isActive: boolean
  onClick:  () => void
}) {
  const deleteQuery = useDeleteListeningQuery()
  const updateQuery = useUpdateListeningQuery(query.id)
  const toast       = useToast()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Stop monitoring "${query.keyword}"?`)) return
    try {
      await deleteQuery.mutateAsync(query.id)
      toast.show('Keyword removed', 'success')
    } catch {
      toast.show('Failed to remove keyword', 'error')
    }
  }

  const handleToggleAlert = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateQuery.mutateAsync({ alertEnabled: !query.alertEnabled })
    } catch {
      toast.show('Failed to update alert', 'error')
    }
  }

  return (
    <div
      className={cn(styles.queryCard, isActive && styles.queryCardActive)}
      onClick={onClick}
    >
      <div className={styles.queryTop}>
        <span className={styles.keyword}>{query.keyword}</span>
        <div className={styles.queryActions}>
          <button
            className={styles.iconBtn}
            onClick={handleToggleAlert}
            title={query.alertEnabled ? 'Disable alerts' : 'Enable alerts'}
          >
            🔔
          </button>
          <button
            className={cn(styles.iconBtn, styles.iconBtnDanger)}
            onClick={handleDelete}
            title="Remove keyword"
          >
            ×
          </button>
        </div>
      </div>

      <div className={styles.queryMeta}>
        {query.platforms.map((p) => (
          <PlatformIcon key={p} platform={p as PlatformIconPlatform} size={12} />
        ))}
        <span className={styles.mentionCount}>{query.mentionCount} mentions</span>
        <span className={cn(
          styles.alertBadge,
          query.alertEnabled ? styles.alertOn : styles.alertOff
        )}>
          {query.alertEnabled ? query.alertFrequency : 'Alerts off'}
        </span>
      </div>

      <div className={styles.sentimentBar}>
        <div className={styles.sentPos} style={{ flex: query.sentimentBreakdown.positive }} />
        <div className={styles.sentNeu} style={{ flex: query.sentimentBreakdown.neutral }} />
        <div className={styles.sentNeg} style={{ flex: query.sentimentBreakdown.negative }} />
      </div>
    </div>
  )
}

export default function ListeningPage() {
  const [showForm,      setShowForm     ] = useState(false)
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null)

  const { data: queries,  isLoading             } = useListeningQueries()
  const { data: mentions, isLoading: mentionsLoading } = useMentions(activeQueryId ?? '')

  const activeQuery = queries?.find((q) => q.id === activeQueryId)

  return (
    <PlanGate
      requiredPlan="ENTERPRISE"
      featureName="Social listening"
      features={[
        'Monitor brand mentions across Facebook and Instagram',
        'AI sentiment analysis — positive, neutral, negative',
        'Real-time, daily, or weekly alert notifications',
        'Unlimited keyword queries',
        'Multi-language support — TH, EN, MY, LA',
      ]}
    >
      <div className={styles.page}>

        <div className={styles.toolbar}>
          <div>
            <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>
              Social listening
            </h2>
            <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', marginTop: '2px' }}>
              Monitor keywords and brand mentions across Facebook and Instagram.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + Monitor keyword
          </Button>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[1, 2, 3].map((n) => <div key={n} className={styles.skeletonCard} />)}
          </div>
        )}

        {!isLoading && queries?.length === 0 && (
          <div className={styles.empty}>
            <svg className={styles.emptyIcon} viewBox="0 0 48 48"
                 fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="24" cy="24" r="8"/>
              <path d="M24 4a20 20 0 010 40M24 8a16 16 0 010 32M24 12a12 12 0 010 24"/>
            </svg>
            <div className={styles.emptyTitle}>No keywords monitored yet</div>
            <div className={styles.emptySub}>
              Add a keyword to start tracking mentions across Facebook and Instagram.
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
              + Monitor first keyword
            </Button>
          </div>
        )}

        {!isLoading && queries && queries.length > 0 && (
          <div className={styles.layout}>
            <div className={styles.queryList}>
              {queries.map((query) => (
                <QueryCard
                  key={query.id}
                  query={query}
                  isActive={activeQueryId === query.id}
                  onClick={() => setActiveQueryId(
                    activeQueryId === query.id ? null : query.id
                  )}
                />
              ))}
            </div>

            {activeQuery ? (
              <div className={styles.mentionsPanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <div className={styles.panelTitle}>&ldquo;{activeQuery.keyword}&rdquo;</div>
                    <div className={styles.panelMeta}>
                      {activeQuery.mentionCount} total mentions · Last found{' '}
                      {activeQuery.lastFoundAt
                        ? new Date(activeQuery.lastFoundAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })
                        : 'never'
                      }
                    </div>
                  </div>
                </div>

                <div className={styles.sentimentSummary}>
                  {[
                    { icon: '😊', cls: styles.sentIconPos, value: activeQuery.sentimentBreakdown.positive,  label: 'Positive' },
                    { icon: '😐', cls: styles.sentIconNeu, value: activeQuery.sentimentBreakdown.neutral,   label: 'Neutral'  },
                    { icon: '😞', cls: styles.sentIconNeg, value: activeQuery.sentimentBreakdown.negative,  label: 'Negative' },
                  ].map(({ icon, cls, value, label }) => (
                    <div key={label} className={styles.sentCard}>
                      <div className={cn(styles.sentIcon, cls)}>{icon}</div>
                      <div>
                        <div className={styles.sentCardValue}>{value}</div>
                        <div className={styles.sentCardLabel}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {mentionsLoading && (
                  <div className={styles.skeletonCard} style={{ height: '120px' }} />
                )}

                {!mentionsLoading && mentions?.map((mention) => (
                  <MentionCard key={mention.id} mention={mention} />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>Select a keyword</div>
                <div className={styles.emptySub}>
                  Click a keyword on the left to see its mentions and sentiment breakdown.
                </div>
              </div>
            )}
          </div>
        )}

        {showForm && <AddQueryModal onClose={() => setShowForm(false)} />}

      </div>
    </PlanGate>
  )
}