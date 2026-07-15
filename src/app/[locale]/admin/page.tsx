'use client'

import { useState } from 'react'
import { Button, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import {
  useAgencies,
  useApproveAgency,
  useSuspendAgency,
  useSetPlan,
  useAgencyDetail,
  usePlatformStats,
  useAllUsers,
  useSetUserStatus,
} from '@/hooks/useAdminAgencies'
import { AdminShell, type AdminSection } from './adminShell'
import styles from './admin.module.css'
import { useAuditLogs } from '@/hooks/useAdminAgencies'
import { useCreateAgency } from '@/hooks/useAdminAgencies'
import { useImpersonate } from '@/hooks/useAdminAgencies'
import { startImpersonation } from '@/lib/impersonation'

const PLANS = ['STARTER', 'PRO', 'AGENCY', 'ENTERPRISE']

function statusVariant(status: string): 'warning' | 'success' | 'danger' | 'neutral' {
  if (status === 'PENDING') return 'warning'
  if (status === 'APPROVED') return 'success'
  if (status === 'SUSPENDED') return 'danger'
  return 'neutral'
}

function userStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'PENDING') return 'warning'
  if (status === 'SUSPENDED') return 'danger'
  return 'neutral'
}

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>('dashboard')

  return (
    <AdminShell section={section} onSectionChange={setSection}>
      {section === 'dashboard' && <DashboardSection />}
      {section === 'agencies' && <AgenciesSection />}
      {section === 'users' && <UsersSection />}
      {section === 'audit' && <AuditSection />}
    </AdminShell>
  )
}


function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function actionVariant(action: string): 'success' | 'danger' | 'neutral' | 'info' {
  if (action.startsWith('APPROVE')) return 'success'
  if (action.startsWith('SUSPEND') || action.includes('SUSPENDED')) return 'danger'
  if (action.startsWith('SET_PLAN')) return 'info'
  return 'neutral'
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

function AuditSection() {
  const { data: logs, isLoading } = useAuditLogs()

  if (isLoading || !logs) return <div className={styles.empty}>Loading audit log…</div>
  if (logs.length === 0) return <div className={styles.empty}>No admin actions recorded yet.</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Action</th>
          <th>Target</th>
          <th>By</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td><Badge variant={actionVariant(log.action)}>{formatAction(log.action)}</Badge></td>
            <td>
              <div className={styles.userName}>{log.targetName ?? '—'}</div>
              <div className={styles.userEmail}>{log.targetType}</div>
            </td>
            <td>{log.actorName}</td>
            <td className={styles.userEmail}>{new Date(log.createdAt).toLocaleString('en-GB')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DashboardSection() {
  const { data: stats, isLoading } = usePlatformStats()

  if (isLoading || !stats) return <div className={styles.empty}>Loading stats…</div>

  const maxPlan = Math.max(...Object.values(stats.planBreakdown), 1)

  return (
    <>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Agencies</div>
          <div className={styles.statValue}>{stats.totalAgencies}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pending</div>
          <div className={styles.statValue}>{stats.pendingAgencies}</div>
          <div className={styles.statHint}>awaiting approval</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Approved</div>
          <div className={styles.statValue}>{stats.approvedAgencies}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Suspended</div>
          <div className={styles.statValue}>{stats.suspendedAgencies}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Users</div>
          <div className={styles.statValue}>{stats.totalUsers}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Clients</div>
          <div className={styles.statValue}>{stats.totalClients}</div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Plan Distribution</div>
        {Object.entries(stats.planBreakdown).map(([plan, count]) => (
          <div key={plan} className={styles.barRow}>
            <div className={styles.barLabel}>{plan}</div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${(count / maxPlan) * 100}%` }}
              />
            </div>
            <div className={styles.barValue}>{count}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function AgenciesSection() {
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
  const impersonate = useImpersonate()

  const handleImpersonate = async (agencyId: string) => {
    const data = await impersonate.mutateAsync(agencyId)
    startImpersonation(data.token)
  }

  const filtered = (agencies ?? []).filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter
    const matchesPlan = planFilter === 'ALL' || a.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  return (
    <>
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
                  <Button variant="ghost" size="sm" loading={impersonate.isPending}
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

function UsersSection() {
  const { data: users, isLoading } = useAllUsers()
  const setStatus = useSetUserStatus()

  const [search, setSearch] = useState('')

  if (isLoading || !users) return <div className={styles.empty}>Loading users…</div>
  if (users.length === 0) return <div className={styles.empty}>No users yet.</div>

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.agencyName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search users, emails, agencies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>User</th>
            <th>Agency</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>
                <div className={styles.userName}>
                  {u.name}
                  {u.platformAdmin && <span className={styles.adminTag}>Admin</span>}
                </div>
                <div className={styles.userEmail}>{u.email}</div>
              </td>
              <td>{u.agencyName}</td>
              <td><Badge variant="neutral">{u.role}</Badge></td>
              <td><Badge variant={userStatusVariant(u.status)}>{u.status}</Badge></td>
              <td>
                {!u.platformAdmin && (
                  u.status === 'SUSPENDED' ? (
                    <Button variant="secondary" size="sm" loading={setStatus.isPending}
                      onClick={() => setStatus.mutate({ id: u.id, status: 'ACTIVE' })}>
                      Reactivate
                    </Button>
                  ) : (
                    <Button variant="danger" size="sm" loading={setStatus.isPending}
                      onClick={() => setStatus.mutate({ id: u.id, status: 'SUSPENDED' })}>
                      Suspend
                    </Button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}