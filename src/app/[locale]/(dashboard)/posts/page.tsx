'use client'

import { useState } from 'react'
import { usePosts } from '@/hooks/usePosts'
import { Button }   from '@/components/ui'
import { PostCard } from '@/components/features/PostCard'
import { PostCalendar } from '@/components/features/PostCalendar'
import { NewPostModal } from '@/components/features/NewPostModal'
import { cn } from '@/lib/utils'
import styles from './posts.module.css'

const TABS = [
  { label: 'All',            value: undefined        },
  { label: 'Draft',          value: 'DRAFT'          },
  { label: 'Pending review', value: 'PENDING_REVIEW' },
  { label: 'Scheduled',      value: 'SCHEDULED'      },
  { label: 'Published',      value: 'PUBLISHED'      },
  { label: 'Failed',         value: 'FAILED'         },
] as const

type StatusFilter = (typeof TABS)[number]['value']

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<StatusFilter>(undefined)
  const [showForm,  setShowForm ] = useState(false)
  const [view,      setView     ] = useState<'list' | 'calendar'>('list')

  const { data: posts, isLoading, isError } = usePosts(activeTab)

  return (
    <div className={styles.page}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>

          {/* View toggle */}
          <div className={styles.tabs}>
            <button
              className={cn(styles.tab, view === 'list' && styles.tabActive)}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              className={cn(styles.tab, view === 'calendar' && styles.tabActive)}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
          </div>

          {/* Status filter — list view only */}
          {view === 'list' && (
            <div className={styles.tabs} role="tablist">
              {TABS.map((tab) => (
                <button
                  key={String(tab.value)}
                  role="tab"
                  aria-selected={activeTab === tab.value}
                  className={cn(
                    styles.tab,
                    activeTab === tab.value && styles.tabActive
                  )}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                  {tab.value === undefined && posts && (
                    <span className={styles.tabCount}>{posts.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          + New post
        </Button>
      </div>

      {/* ── Calendar view ── */}
      {view === 'calendar' && <PostCalendar />}

      {/* ── List view ── */}
      {view === 'list' && (
        <>
          {/* Loading skeleton */}
          {isLoading && (
            <div className={styles.skeleton}>
              {[1, 2, 3].map((n) => (
                <div key={n} className={styles.skeletonCard} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Failed to load posts</span>
              <span className={styles.emptySub}>
                Check your connection and try again.
              </span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && posts?.length === 0 && (
            <div className={styles.empty}>
              <svg
                className={styles.emptyIcon}
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="4" y="4" width="40" height="40" rx="6" />
                <path d="M12 16h24M12 24h18M12 32h12" />
              </svg>
              <div className={styles.emptyTitle}>No posts yet</div>
              <div className={styles.emptySub}>
                Schedule your first post to see it appear here.
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                + Create first post
              </Button>
            </div>
          )}

          {/* Post list */}
          {!isLoading && !isError && posts && posts.length > 0 && (
            <div className={styles.list}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}

      {/* New post modal */}
      {showForm && <NewPostModal onClose={() => setShowForm(false)} />}

    </div>
  )
}