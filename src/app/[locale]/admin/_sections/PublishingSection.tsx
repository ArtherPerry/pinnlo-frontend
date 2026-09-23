'use client'

import {
  usePublishingOverview,
  type FailureKindKey,
  type InProgressTarget,
  type PublishFailure,
  type UpcomingPost,
} from '@/hooks/useAdminPublishing'
import styles from './publishing.module.css'

const ZONE = 'Asia/Bangkok'
const count = new Intl.NumberFormat('en-US')

const PLATFORM_NAMES: Record<string, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  WHATSAPP: 'WhatsApp',
}

/** Plain words for each kind — the question is always whether it went live. */
const KIND_LABEL: Record<FailureKindKey, string> = {
  RETRYABLE: 'Retryable',
  NEEDS_CHANGES: 'Needs changes',
  OUTCOME_UNKNOWN: 'Outcome unknown',
  UNCLASSIFIED: 'Unclassified',
}

export function PublishingSection() {
  const { data, isLoading, isError, refetch } = usePublishingOverview()

  if (isLoading) return <p className={styles.muted}>Loading publishing…</p>

  if (isError || !data) {
    return (
      <div className={styles.errorBox} role="alert">
        <span>Publishing could not be loaded.</span>
        <button type="button" className={styles.button} onClick={() => refetch()}>
          Try again
        </button>
      </div>
    )
  }

  const s = data.summary

  return (
    <div className={styles.root}>
      <p className={styles.explainer}>
        Read-only. Publishing a client&apos;s post again is the agency&apos;s decision, so there is no
        retry here. What this shows is whether each failure could already be live.
      </p>

      <section className={styles.figures} aria-label={`Last ${data.windowDays} days`}>
        <Figure label="Publish attempts" value={count.format(s.attempted)} />
        <Figure label="Published" value={count.format(s.published)} />
        <Figure
          label="Success rate"
          value={s.successRate === null ? '—' : `${s.successRate}%`}
          note={s.successRate === null ? 'Nothing attempted yet' : undefined}
        />
        <Figure
          label="Need a person"
          value={count.format(s.needsPerson)}
          note={s.beingChecked > 0 ? `${s.beingChecked} being checked with Meta` : undefined}
          alert={s.needsPerson > 0}
        />
      </section>

      <Failures failures={data.failures} days={data.windowDays} />
      <InProgress items={data.inProgress} />
      <Upcoming items={data.upcoming} />
    </div>
  )
}

function Figure({
  label,
  value,
  note,
  alert,
}: {
  label: string
  value: string
  note?: string
  alert?: boolean
}) {
  return (
    <div className={styles.figure}>
      <div className={styles.figureLabel}>{label}</div>
      <div className={`${styles.figureValue} ${alert ? styles.alertText : ''}`}>{value}</div>
      {note && <div className={styles.muted}>{note}</div>}
    </div>
  )
}

// ── Failures ───────────────────────────────────────────────────────

function Failures({ failures, days }: { failures: PublishFailure[]; days: number }) {
  return (
    <section className={styles.panel} aria-labelledby="failures-heading">
      <div className={styles.panelHead}>
        <h2 id="failures-heading" className={styles.panelTitle}>
          Failed publishes, last {days} days
        </h2>
      </div>
      {failures.length === 0 ? (
        <p className={styles.emptyNote}>
          No failed publishes. Failures appear here with whether anything could already be live.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Post</th>
                <th scope="col">What it means</th>
                <th scope="col">Failed</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((f) => (
                <tr key={f.targetId}>
                  <td>
                    <div className={styles.strong}>{f.clientName}</div>
                    <div className={styles.muted}>
                      {f.agencyName}, {PLATFORM_NAMES[f.platform] ?? f.platform}
                    </div>
                  </td>
                  <td className={styles.content}>{f.content || <span className={styles.muted}>No text</span>}</td>
                  <td>
                    <Meaning f={f} />
                  </td>
                  <td className={styles.muted}>{when(f.claimedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Meaning({ f }: { f: PublishFailure }) {
  const needsPerson = f.review === 'NEEDS_PERSON'
  const checking = f.review === 'CHECKING'
  const badge = needsPerson ? styles.badgeFailed : checking ? styles.badgeWarn : styles.badgeSafe

  return (
    <div className={styles.meaning}>
      {/* The word carries the meaning; colour only reinforces it. */}
      <span className={`${styles.badge} ${badge}`}>{KIND_LABEL[f.kind]}</span>
      <span className={styles.explain}>{explain(f)}</span>
      {f.error && <span className={styles.error}>{f.error}</span>}
    </div>
  )
}

function explain(f: PublishFailure): string {
  switch (f.kind) {
    case 'RETRYABLE':
      return 'Nothing was published. Safe to try again.'
    case 'NEEDS_CHANGES':
      return 'Nothing was published. The cause needs fixing first.'
    case 'UNCLASSIFIED':
      return 'Failed before failures were classified. Treat it as unknown and check the page.'
    case 'OUTCOME_UNKNOWN':
      if (f.review === 'CHECKING') {
        return f.nextReconcileAt
          ? `Being checked with Meta automatically. Next check ${when(f.nextReconcileAt)}.`
          : 'Being checked with Meta automatically.'
      }
      return 'It may have gone live. Check the page before publishing again.'
  }
}

// ── In progress ────────────────────────────────────────────────────

function InProgress({ items }: { items: InProgressTarget[] }) {
  return (
    <section className={styles.panel} aria-labelledby="progress-heading">
      <div className={styles.panelHead}>
        <h2 id="progress-heading" className={styles.panelTitle}>
          Publishing now
        </h2>
      </div>
      {items.length === 0 ? (
        <p className={styles.emptyNote}>Nothing is being published right now.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((i) => (
            <li key={i.targetId} className={styles.listRow}>
              <div>
                <div className={styles.strong}>{i.clientName}</div>
                <div className={styles.muted}>
                  {i.agencyName}, {PLATFORM_NAMES[i.platform] ?? i.platform}
                </div>
              </div>
              <div className={i.overdue ? styles.alertText : styles.muted}>
                {i.overdue
                  ? `Running ${i.minutes} min — will be marked as an unknown outcome`
                  : `Started ${i.minutes} min ago`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── Upcoming ───────────────────────────────────────────────────────

function Upcoming({ items }: { items: UpcomingPost[] }) {
  return (
    <section className={styles.panel} aria-labelledby="upcoming-heading">
      <div className={styles.panelHead}>
        <h2 id="upcoming-heading" className={styles.panelTitle}>
          Scheduled, next 7 days
        </h2>
      </div>
      {items.length === 0 ? (
        <p className={styles.emptyNote}>No posts scheduled in the next 7 days.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((u) => (
            <li key={u.postId} className={styles.listRow}>
              <div className={styles.upcomingMain}>
                <div className={styles.strong}>{u.clientName}</div>
                <div className={styles.muted}>
                  {u.agencyName}, {u.platforms.map((p) => PLATFORM_NAMES[p] ?? p).join(' and ')}
                </div>
                <div className={styles.content}>{u.content}</div>
              </div>
              <div className={styles.when}>{when(u.scheduledAt)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

/** An instant shown in Bangkok time, with the date only when it is not today. */
function when(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const day = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: ZONE })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: ZONE })
  if (day(d) === day(new Date())) return `today ${time}`
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: ZONE })
  return `${date}, ${time}`
}