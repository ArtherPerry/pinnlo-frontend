'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useBenchmarks,
  useCreateBenchmark,
  useDeleteBenchmark,
} from '@/hooks/useCompetitors'
import { useClients } from '@/hooks/useClients'
import { Button, Input, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { BenchmarkGroup, BenchmarkMember } from '@/lib/types'
import styles from './benchmarks.module.css'

// ── Helpers ────────────────────────────────────────────────────────
function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

// ── Inline bar ────────────────────────────────────────────────────
function MetricBar({
  value, max, isOwn, label,
}: {
  value: number; max: number; isOwn: boolean; label: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className={styles.barWrapper}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div
          className={cn(styles.barFill, !isOwn && styles.barFillOther)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Benchmark group card ──────────────────────────────────────────
function BenchmarkCard({ group }: { group: BenchmarkGroup }) {
  const deleteBenchmark = useDeleteBenchmark()
  const toast           = useToast()

  const handleDelete = async () => {
    if (!confirm(`Delete benchmark group "${group.name}"?`)) return
    try {
      await deleteBenchmark.mutateAsync(group.id)
      toast.show('Benchmark group deleted', 'success')
    } catch {
      toast.show('Failed to delete benchmark group', 'error')
    }
  }

  const maxFollowers   = Math.max(...group.members.map((m) => m.followers))
  const maxEngagement  = Math.max(...group.members.map((m) => m.engagementRate))
  const maxPosts       = Math.max(...group.members.map((m) => m.postsPerWeek))

  // Find winners
  const followerWinner   = group.members.reduce((a, b) => a.followers > b.followers ? a : b)
  const engagementWinner = group.members.reduce((a, b) => a.engagementRate > b.engagementRate ? a : b)

  const ownMember = group.members.find((m) => m.isOwn)

  return (
    <div className={styles.groupCard}>
      {/* Header */}
      <div className={styles.groupHeader}>
        <div className={styles.groupHeaderLeft}>
          <span className={styles.groupName}>{group.name}</span>
          <span className={styles.groupMeta}>
            {group.clientName} · {group.members.length} members
            {ownMember && (
              <> · Your page: <strong>{formatFollowers(ownMember.followers)}</strong> followers</>
            )}
          </span>
        </div>
        <div className={styles.groupHeaderRight}>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            Delete group
          </button>
        </div>
      </div>

      {/* Comparison table */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Page</th>
            <th>Followers</th>
            <th>Engagement</th>
            <th>Posts/week</th>
          </tr>
        </thead>
        <tbody>
          {group.members
            .sort((a, b) => b.followers - a.followers)
            .map((member) => (
              <tr
                key={member.id}
                className={member.isOwn ? styles.ownRow : undefined}
              >
                {/* Identity */}
                <td>
                  <div className={styles.memberIdentity}>
                    <div className={cn(
                      styles.memberAvatar,
                      member.isOwn
                        ? styles.memberAvatarOwn
                        : styles.memberAvatarOther
                    )}>
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.memberName}>{member.name}</div>
                      {member.isOwn && (
                        <span className={styles.ownBadge}>Your page</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Followers */}
                <td>
                  <div className={styles.metricCell}>
                    <MetricBar
                      value={member.followers}
                      max={maxFollowers}
                      isOwn={member.isOwn}
                      label={formatFollowers(member.followers)}
                    />
                    {member.id === followerWinner.id && (
                      <span className={styles.winner}>▲ Most followers</span>
                    )}
                  </div>
                </td>

                {/* Engagement */}
                <td>
                  <div className={styles.metricCell}>
                    <MetricBar
                      value={member.engagementRate}
                      max={maxEngagement}
                      isOwn={member.isOwn}
                      label={`${member.engagementRate.toFixed(1)}%`}
                    />
                    {member.id === engagementWinner.id && (
                      <span className={styles.winner}>▲ Best engagement</span>
                    )}
                  </div>
                </td>

                {/* Posts/week */}
                <td>
                  <div className={styles.metricCell}>
                    <MetricBar
                      value={member.postsPerWeek}
                      max={maxPosts}
                      isOwn={member.isOwn}
                      label={`${member.postsPerWeek}×`}
                    />
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Create group modal ────────────────────────────────────────────
const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  clientId: z.string().min(1, 'Select a client workspace'),
})

type FormValues = z.infer<typeof schema>

function CreateBenchmarkModal({ onClose }: { onClose: () => void }) {
  const { data: clients, isLoading: clientsLoading } = useClients()
  const createBenchmark = useCreateBenchmark()
  const toast           = useToast()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', clientId: '' },
  })

  const selectedClientId = watch('clientId')

  const onSubmit = async (values: FormValues) => {
    try {
      await createBenchmark.mutateAsync({
        name:          values.name,
        clientId:      values.clientId,
        competitorIds: [],
      })
      toast.show('Benchmark group created ✓', 'success')
      onClose()
    } catch {
      toast.show('Failed to create benchmark group', 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Create benchmark group</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.modalBody}>

            <Input
              label="Group name"
              placeholder="Coffee Market Bangkok"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <div>
              <span className={styles.sectionLabel}>Client workspace</span>
              {clientsLoading ? (
                <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
                  Loading...
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
                <p className={styles.formError}>{errors.clientId.message}</p>
              )}
            </div>

            <p style={{
              fontSize: 'var(--text-small)',
              color: 'var(--color-muted)',
              lineHeight: 1.6,
              background: 'var(--color-bg)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
            }}>
              After creating the group, tracked competitors for this client
              will automatically be added as members alongside your client page.
            </p>

          </div>

          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Create group
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function BenchmarksPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: benchmarks, isLoading } = useBenchmarks()

  return (
    <div className={styles.page}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>
          Benchmark groups
        </h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          + Create group
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={styles.skeleton}>
          {[1, 2].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && benchmarks?.length === 0 && (
        <div className={styles.empty}>
          <svg
            className={styles.emptyIcon}
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 36l10-10 8 8 12-14 10 10"/>
            <path d="M4 44h40"/>
          </svg>
          <div className={styles.emptyTitle}>No benchmark groups yet</div>
          <div className={styles.emptySub}>
            Create a benchmark group to compare your client pages side-by-side
            against tracked competitors.
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + Create first group
          </Button>
        </div>
      )}

      {/* Benchmark groups */}
      {!isLoading && benchmarks && benchmarks.length > 0 && (
        <div className={styles.groupList}>
          {benchmarks.map((group) => (
            <BenchmarkCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <CreateBenchmarkModal onClose={() => setShowForm(false)} />
      )}

    </div>
  )
}