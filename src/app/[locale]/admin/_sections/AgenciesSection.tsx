'use client'

import { useState } from 'react'
import { Button, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'
import { startImpersonation } from '@/lib/impersonation'
import {
  useAgencies,
  useApproveAgency,
  useSuspendAgency,
  useSetPlan,
  useAgencyDetail,
  useCreateAgency,
} from '@/hooks/useAdminAgencies'
import { PLANS, statusVariant } from '../_lib/format'
import styles from '../admin.module.css'

export function AgenciesSection() {
  const { data: agencies, isLoading } = useAgencies()
  const approve = useApproveAgency()
  const suspend = useSuspendAgency()
  const setPlan = useSetPlan()
  const [showCreate, setShowCreate] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: detail } = useAgencyDetail(selectedId)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [impersonateError, setImpersonateError] = useState<string | null>(null)
  // Which row is starting a session, so only that button shows progress.
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  /**
   * startImpersonation both calls the endpoint and stores the returned token.
   * The mutation that used to run first called the same endpoint again, with
   * the token where the agency id belongs — which is why this failed with 500.
   *
   * Afterwards the admin session has been replaced by the support session, so
   * the admin screens would refuse every request. Go to the agency's own app.
   */
  const handleImpersonate = async (agencyId: string) => {
    setImpersonateError(null)
    setImpersonatingId(agencyId)
    try {
      await startImpersonation(agencyId)
      const locale = pathname.split('/')[1] ?? 'en'
      router.push(`/${locale}/dashboard`)
    } catch {
      setImpersonateError('Could not start the support session. Please try again.')
      setImpersonatingId(null)
    }
    // Left set on success: the page is navigating away, and re-enabling the
    // button first would invite a second click.
  }

  const filtered = (agencies ?? []).filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter
    const matchesPlan = planFilter === 'ALL' || a.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  return (
    <>
      {impersonateError && <div className={styles.empty}>{impersonateError}</div>}
      {isLoading && <div className={styles.empty}>Loading agencies…</div>}
      {!isLoading && agencies && agencies.length === 0 && (
        <div className={styles.empty}>No agencies yet.</div>
      )}

      {!isLoading && agencies && agencies.length > 0 && (
        <>
        <div className={styles.sectionHeader}>
            <div />
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              + Create Agency
            </Button>
          </div>
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              placeholder="Search agencies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select
              className={styles.filterSelect}
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="ALL">All plans</option>
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className={styles.list}>
            {filtered.length === 0 && (
              <div className={styles.empty}>No agencies match your filters.</div>
            )}
            {filtered.map((a) => (
              <div key={a.id} className={styles.card}>
                <div className={styles.info}>
                  <button
                    type="button"
                    className={styles.name}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedId(a.id)}
                  >
                    {a.name}
                  </button>
                  <span className={styles.meta}>
                    <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                    <span>·</span>
                    <span>Created {formatDate(a.createdAt, 'en-GB')}</span>
                  </span>
                </div>
                <div className={styles.actions}>
                  <select
                    className={styles.select}
                    value={a.plan}
                    onChange={(e) => setPlan.mutate({ id: a.id, plan: e.target.value })}
                    disabled={setPlan.isPending}
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {a.status !== 'APPROVED' && (
                    <Button variant="primary" size="sm" loading={approve.isPending}
                      onClick={() => approve.mutate(a.id)}>
                      Approve
                    </Button>
                  )}
                  {a.status !== 'SUSPENDED' && (
                    <Button variant="secondary" size="sm" loading={suspend.isPending}
                      onClick={() => suspend.mutate(a.id)}>
                      Suspend
                    </Button>
                  )}
                  {a.status === 'APPROVED' && (
                  <Button variant="ghost" size="sm" loading={impersonatingId === a.id}
                    onClick={() => handleImpersonate(a.id)}>
                    Impersonate
                  </Button>
                )}
                </div>
              </div>
            ))}
          </div>
          {showCreate && <CreateAgencyModal onClose={() => setShowCreate(false)} />}
        </>
      )}

      {selectedId && detail && (
        <div className={styles.detailOverlay} onClick={() => setSelectedId(null)}>
          <div className={styles.detailPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.detailTitle}>{detail.name}</div>
                <div className={styles.detailMeta}>
                  <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
                  <span>·</span>
                  <span>{detail.plan}</span>
                  <span>·</span>
                  <span>{detail.userCount} users, {detail.clientCount} clients</span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedId(null)} aria-label="Close">×</button>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Team ({detail.users.length})</div>
              {detail.users.map((u) => (
                <div key={u.id} className={styles.detailRow}>
                  <div className={styles.detailRowMain}>
                    <span className={styles.detailRowName}>{u.name}</span>
                    <span className={styles.detailRowSub}>{u.email}</span>
                  </div>
                  <Badge variant="neutral">{u.role}</Badge>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Clients ({detail.clients.length})</div>
              {detail.clients.length === 0 && (
                <div className={styles.detailRowSub}>No clients yet.</div>
              )}
              {detail.clients.map((c) => (
                <div key={c.id} className={styles.detailRow}>
                  <div className={styles.detailRowMain}>
                    <span className={styles.detailRowName}>{c.name}</span>
                    <span className={styles.detailRowSub}>{c.platformCount} platform(s)</span>
                  </div>
                  <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>{c.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CreateAgencyModal({ onClose }: { onClose: () => void }) {
  const create = useCreateAgency()
  const [agencyName, setAgencyName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [plan, setPlan] = useState('STARTER')
  const [result, setResult] = useState<{ tempPassword: string } | null>(null)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setError('')
    if (!agencyName.trim() || !ownerName.trim() || !ownerEmail.trim()) {
      setError('All fields are required')
      return
    }
    try {
      const data = await create.mutateAsync({ agencyName, ownerName, ownerEmail, plan })
      setResult({ tempPassword: data.tempPassword })
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err?.response?.data?.message ?? 'Failed to create agency')
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!result ? (
          <>
            <div className={styles.modalTitle}>Create Agency</div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Agency Name</label>
              <input className={styles.fieldInput} value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Owner Name</label>
              <input className={styles.fieldInput} value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Owner Email</label>
              <input className={styles.fieldInput} type="email" value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Plan</label>
              <select className={styles.select} value={plan}
                onChange={(e) => setPlan(e.target.value)}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {error && <div style={{ color: 'var(--color-danger, #dc2626)', fontSize: 13 }}>{error}</div>}
            <div className={styles.modalActions}>
              <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="sm" loading={create.isPending} onClick={handleCreate}>
                Create
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.modalTitle}>Agency Created</div>
            <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 8 }}>
              Share this temporary password with the owner. They can change it after logging in.
            </p>
            <div className={styles.tempPasswordBox}>
              <div className={styles.tempPasswordLabel}>Temporary Password</div>
              <div className={styles.tempPasswordValue}>{result.tempPassword}</div>
            </div>
            <div className={styles.modalActions}>
              <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}