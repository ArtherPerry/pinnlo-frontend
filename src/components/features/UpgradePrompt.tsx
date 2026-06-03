import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { usePlanTier } from '@/hooks/useAuth'
import type { Plan } from '@/lib/types'
import styles from './UpgradePrompt.module.css'

interface UpgradePromptProps {
  requiredPlan: 'AGENCY' | 'ENTERPRISE'
  featureName:  string
  features:     string[]
  onUpgrade?:   () => void
}

const PLAN_LABELS: Record<Plan, string> = {
  STARTER:    'Starter',
  PRO:        'Pro',
  AGENCY:     'Agency',
  ENTERPRISE: 'Enterprise',
}

export function UpgradePrompt({
  requiredPlan,
  featureName,
  features,
  onUpgrade,
}: UpgradePromptProps) {
  const currentPlan = usePlanTier()
  const isEnterprise = requiredPlan === 'ENTERPRISE'

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Navigate to billing settings
      window.location.href = '/th/settings?tab=billing'
    }
  }

  return (
    <div className={styles.wrapper}>

      {/* Icon */}
      <div className={cn(
        styles.icon,
        isEnterprise ? styles.iconEnterprise : styles.iconAgency
      )}>
        {isEnterprise ? '⚡' : '🏢'}
      </div>

      {/* Plan badge */}
      <span className={cn(
        styles.planBadge,
        isEnterprise ? styles.badgeEnterprise : styles.badgeAgency
      )}>
        {PLAN_LABELS[requiredPlan]} plan
      </span>

      {/* Title */}
      <h2 className={styles.title}>{featureName}</h2>

      {/* Subtitle */}
      <p className={styles.sub}>
        {isEnterprise
          ? `${featureName} is available on the Enterprise plan. Upgrade to unlock advanced capabilities designed for large agencies and multi-brand corporations.`
          : `${featureName} is available on the Agency plan and above. Upgrade to access this and other powerful agency features.`
        }
      </p>

      {/* Feature list */}
      <div className={styles.featureList}>
        {features.map((feature) => (
          <div key={feature} className={styles.featureItem}>
            <span className={cn(
              styles.featureCheck,
              isEnterprise ? styles.checkEnterprise : styles.checkAgency
            )}>
              ✓
            </span>
            {feature}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="primary" onClick={handleUpgrade}>
          Upgrade to {PLAN_LABELS[requiredPlan]}
        </Button>
        <Button variant="secondary" onClick={() => window.open('https://pinnlo.io/pricing', '_blank')}>
          View pricing ↗
        </Button>
      </div>

      {currentPlan && (
        <p className={styles.currentPlan}>
          Current plan: {PLAN_LABELS[currentPlan]}
        </p>
      )}

    </div>
  )
}