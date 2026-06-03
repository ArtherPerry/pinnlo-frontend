import { usePlanTier } from '@/hooks/useAuth'
import type { Plan } from '@/hooks/useAuth'

function atLeast(current: Plan | undefined, required: Plan): boolean {
  const ORDER: Plan[] = ['STARTER', 'PRO', 'AGENCY', 'ENTERPRISE']
  if (!current) return false
  return ORDER.indexOf(current) >= ORDER.indexOf(required)
}

export function usePlan() {
  const plan = usePlanTier() ?? undefined

  return {
    plan,
    isStarter:    atLeast(plan, 'STARTER'),
    isPro:        atLeast(plan, 'PRO'),
    isAgency:     atLeast(plan, 'AGENCY'),
    isEnterprise: atLeast(plan, 'ENTERPRISE'),
    canSeeHeatmap:     atLeast(plan, 'PRO'),
    canSeeCompetitors: atLeast(plan, 'AGENCY'),
    canSeeBenchmarks:  atLeast(plan, 'AGENCY'),
    canSeePortals:     atLeast(plan, 'AGENCY'),
    canSeeListening:   atLeast(plan, 'ENTERPRISE'),
    canSeeInfluencers: atLeast(plan, 'ENTERPRISE'),
    canSeeAPI:         atLeast(plan, 'ENTERPRISE'),
    canExportCSV:      atLeast(plan, 'PRO'),
  }
}