'use client'

import { useState } from 'react'
import { Button, Badge } from '@/components/ui'
import {
  useAllUsers,
  useSetUserStatus,
} from '@/hooks/useAdminAgencies'
import { userStatusVariant } from '../_lib/format'
import styles from '../admin.module.css'

export function UsersSection() {
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