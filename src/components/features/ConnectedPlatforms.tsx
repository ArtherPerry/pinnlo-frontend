'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui'
import {
  useClientConnections,
  useStartMetaConnect,
  useDisconnectMetaConnection,
  usePageInfo,
  usePageInsights,
} from '@/hooks/useMeta'
import { useToast } from '@/hooks/useToast'
import { cn, formatDate } from '@/lib/utils'
import { Plus, ChevronDown } from 'lucide-react'
import { PlatformIcon } from '@/components/ui'
import styles from './ConnectedPlatforms.module.css'

interface Props {
  clientId:   string
  clientName: string
}

export function ConnectedPlatforms({ clientId, clientName }: Props) {
  const locale     = useLocale()
  const toast      = useToast()
  const { data: connections, isLoading } = useClientConnections(clientId)
  const start      = useStartMetaConnect()
  const disconnect = useDisconnectMetaConnection()

  const handleConnect = async () => {
    try {
      // On success the hook navigates the browser to Facebook, so nothing
      // after this runs on the happy path.
      await start.mutateAsync({ clientId, locale })
    } catch {
      toast.show('Could not start the Facebook connection. Please try again.', 'error')
    }
  }

  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`Disconnect "${name}"? Posts will stop publishing to it.`)) return
    try {
      await disconnect.mutateAsync(id)
      toast.show('Disconnected', 'success')
    } catch {
      toast.show('Failed to disconnect', 'error')
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>Connected platforms</div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConnect}
          disabled={start.isPending}
        >
          <Plus size={14} />
          {start.isPending ? 'Opening Facebook…' : 'Connect Facebook Page'}
        </Button>
      </div>

      {isLoading && <div className={styles.loading}>Loading connections…</div>}

      {!isLoading && connections?.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>No platforms connected</div>
          <div className={styles.emptySub}>
            Connect {clientName}&apos;s Facebook Page to schedule and publish posts.
            If the Page has a linked Instagram Business account, it is connected
            at the same time.
          </div>
        </div>
      )}

      {!isLoading && connections && connections.length > 0 && (
        <div className={styles.list}>
          {connections.map((c) => (
            <div key={c.id}>
              <div className={styles.row}>
                <PlatformIcon platform={c.platform} size={18} />

                <div className={styles.rowMain}>
                  <div className={styles.rowName}>{c.externalName}</div>
                  <div className={styles.rowMeta}>
                    {c.active ? 'Connected' : 'Inactive'}
                    {' · '}
                    {formatDate(c.connectedAt, locale, { dateStyle: 'medium' })}
                    <PageStats
                      connectionId={c.id}
                      enabled={c.active && c.platform === 'FACEBOOK'}
                      locale={locale}
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(c.id, c.externalName)}
                  disabled={disconnect.isPending}
                >
                  Disconnect
                </Button>
              </div>

              {c.platform === 'FACEBOOK' && c.active && (
                <PageInsights connectionId={c.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Follower count, when Meta will give one.
 *
 * Facebook only: the backend asks Graph for fan_count, which does not exist on
 * an Instagram Business account, so an IG connection would return an error
 * rather than a smaller payload.
 *
 * Renders nothing while loading or on failure. An expired token or a revoked
 * page should not put an error into a row that is otherwise fine — the name,
 * status and connection date are all still true and still useful.
 */
function PageStats({
  connectionId,
  enabled,
  locale,
}: {
  connectionId: string
  enabled:      boolean
  locale:       string
}) {
  const { data } = usePageInfo(connectionId, enabled)

  if (!data) return null

  const followers = data.followers_count ?? data.fan_count
  if (followers == null) return null

  return (
    <>
      {' · '}
      {followers.toLocaleString(locale)} followers
    </>
  )
}

/**
 * Page metrics, loaded when the user asks for them.
 *
 * Collapsed by default because this is a live round trip to Graph per
 * connection — opening a drawer with four pages should not fire four external
 * calls for a panel nobody looked at.
 *
 * No interpretation here: the backend picks which metric and period each card
 * shows and supplies the labels, because Graph's own titles are absent for some
 * metrics and contradictory for others.
 */
function PageInsights({ connectionId }: { connectionId: string }) {
  const [open, setOpen] = useState(false)
  const { data: metrics, isLoading, isError } = usePageInsights(connectionId, open)

  return (
    <div className={styles.insights}>
      <button className={styles.insightsToggle} onClick={() => setOpen((o) => !o)}>
        <ChevronDown
          size={14}
          className={cn(styles.insightsChevron, open && styles.insightsChevronOpen)}
        />
        {open ? 'Hide insights' : 'View insights'}
      </button>

      {open && (
        <div className={styles.insightsBody}>
          {isLoading && (
            <span className={styles.insightsMuted}>Loading from Facebook…</span>
          )}

          {isError && (
            <span className={styles.insightsMuted}>
              Facebook did not return insights for this page.
            </span>
          )}

          {!isLoading && !isError && metrics?.length === 0 && (
            <span className={styles.insightsMuted}>
              No metrics available for this page.
            </span>
          )}

          {metrics?.map((m) => (
            <div key={m.metric} className={styles.insightItem}>
              <span className={styles.insightValue}>{m.value.toLocaleString()}</span>
              <span className={styles.insightLabel}>{m.label}</span>
              <span className={styles.insightPeriod}>{m.periodLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}