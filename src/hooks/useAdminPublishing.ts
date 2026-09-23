import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

/** Safety of a failure: could the post already be live? */
export type FailureKindKey = 'RETRYABLE' | 'NEEDS_CHANGES' | 'OUTCOME_UNKNOWN' | 'UNCLASSIFIED'

/**
 * For an unknown outcome: still being checked with Meta, or needing a
 * person. Null for failures known not to have published.
 */
export type ReviewState = 'CHECKING' | 'NEEDS_PERSON' | null

export interface PublishFailure {
  targetId: string
  postId: string
  agencyName: string
  clientName: string
  platform: string
  content: string
  error: string | null
  kind: FailureKindKey
  review: ReviewState
  reconcileAttempts: number
  nextReconcileAt: string | null
  claimedAt: string | null
}

export interface InProgressTarget {
  targetId: string
  agencyName: string
  clientName: string
  platform: string
  claimedAt: string | null
  minutes: number
  /** Past the stuck threshold: the sweep will mark it as an unknown outcome. */
  overdue: boolean
}

export interface UpcomingPost {
  postId: string
  agencyName: string
  clientName: string
  platforms: string[]
  content: string
  scheduledAt: string
}

export interface PublishingOverview {
  windowDays: number
  summary: {
    attempted: number
    published: number
    failed: number
    successRate: number | null
    byKind: Record<FailureKindKey, number>
    beingChecked: number
    needsPerson: number
  }
  failures: PublishFailure[]
  inProgress: InProgressTarget[]
  upcoming: UpcomingPost[]
}

/** Refreshes every minute, so in-progress publishes and checks stay current. */
export function usePublishingOverview() {
  return useQuery({
    queryKey: ['admin', 'publishing'],
    queryFn: async (): Promise<PublishingOverview> => {
      const { data } = await api.get('/api/v1/admin/publishing')
      return data
    },
    refetchInterval: 60_000,
  })
}