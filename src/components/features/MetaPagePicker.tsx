'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { useMetaPendingPages, useConnectMetaPage } from '@/hooks/useMeta'
import { useToast } from '@/hooks/useToast'
import { X } from 'lucide-react'
import { PlatformIcon } from '@/components/ui'
import styles from './MetaPagePicker.module.css'

interface Props {
  nonce:      string
  onClose:    () => void
  onComplete: (clientId: string) => void
}

export function MetaPagePicker({ nonce, onClose, onComplete }: Props) {
    const { data, isLoading, isError } = useMetaPendingPages(nonce)
  const connect = useConnectMetaPage()
  const toast   = useToast()

  const [selected, setSelected] = useState<string | null>(null)

  // Exactly one page is the common case for a small client — preselect it
  // so the user only has to confirm.
  useEffect(() => {
    if (data?.pages.length === 1) setSelected(data.pages[0].pageId)
  }, [data])

  const handleConnect = async () => {
    if (!selected || !data) return
    try {
      const created = await connect.mutateAsync({ nonce, pageId: selected })
      const hasIg = created.some((c) => c.platform === 'INSTAGRAM')
      toast.show(
        hasIg ? 'Facebook Page and Instagram account connected' : 'Facebook Page connected',
        'success'
      )
      onComplete(data.clientId)
    } catch {
      toast.show('Could not connect this page. Please try again.', 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Choose a Facebook Page</div>
            <div className={styles.subtitle}>
              Pick the page that belongs to this client. Only this page will be connected.
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {isLoading && (
          <div className={styles.state}>Loading your pages…</div>
        )}

        {isError && (
          <div className={styles.state}>
            <div className={styles.stateTitle}>This connection link has expired</div>
            <div className={styles.stateSub}>
              Links are valid for 10 minutes. Close this and start again.
            </div>
          </div>
        )}

        {data && data.pages.length === 0 && (
          <div className={styles.state}>
            <div className={styles.stateTitle}>No pages found</div>
            <div className={styles.stateSub}>
              This Facebook account does not administer any Pages. Sign in with an
              account that has admin access to the client&apos;s Page.
            </div>
          </div>
        )}

        {data && data.pages.length > 0 && (
          <>
            <div className={styles.list} role="radiogroup">
              {data.pages.map((page) => {
                const isSelected = selected === page.pageId
                return (
                  <button
                    key={page.pageId}
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.pageRow} ${isSelected ? styles.pageRowSelected : ''}`}
                    onClick={() => setSelected(page.pageId)}
                  >
                    <span className={styles.radio} aria-hidden="true">
                      {isSelected && <span className={styles.radioDot} />}
                    </span>

                    <span className={styles.pageMain}>
                      <span className={styles.pageName}>{page.name}</span>
                                            <span className={styles.pageMeta}>
                        <PlatformIcon platform="FACEBOOK" size={13} />
                        {page.fanCount.toLocaleString()} followers
                      </span>

                      {page.instagram && (
                        <span className={styles.igRow}>
                          <PlatformIcon platform="INSTAGRAM" size={13} />
                          @{page.instagram.username}
                          <span className={styles.igTag}>connected together</span>
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className={styles.footer}>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConnect}
                disabled={!selected || connect.isPending}
              >
                {connect.isPending ? 'Connecting…' : 'Connect page'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}