'use client'

import { usePlanTier } from '@/hooks/useAuth'
import { UpgradePrompt } from './UpgradePrompt'
import type { Plan } from '@/lib/types'

const PLAN_ORDER: Plan[] = ['STARTER', 'PRO', 'AGENCY', 'ENTERPRISE']

interface PlanGateProps {
  requiredPlan: 'AGENCY' | 'ENTERPRISE'
  featureName:  string
  features:     string[]
  children:     React.ReactNode
}

export function PlanGate({
  requiredPlan,
  featureName,
  features,
  children,
}: PlanGateProps) {
  const currentPlan   = usePlanTier()
  const currentIndex  = currentPlan ? PLAN_ORDER.indexOf(currentPlan) : 0
  const requiredIndex = PLAN_ORDER.indexOf(requiredPlan)

  if (currentIndex < requiredIndex) {
    return (
      <UpgradePrompt
        requiredPlan={requiredPlan}
        featureName={featureName}
        features={features}
      />
    )
  }

  return <>{children}</>
}