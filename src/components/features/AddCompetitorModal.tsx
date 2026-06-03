'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, PlatformIcon } from '@/components/ui'
import { useClients } from '@/hooks/useClients'
import { useAddCompetitor } from '@/hooks/useCompetitors'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { CompetitorPlatform } from '@/lib/types'
import styles from './AddCompetitorModal.module.css'

const PLATFORMS: CompetitorPlatform[] = ['FACEBOOK', 'INSTAGRAM']

const schema = z.object({
  name:      z.string().min(2, 'Name must be at least 2 characters'),
  platform:  z.enum(['FACEBOOK', 'INSTAGRAM']),
  pageUrl:   z.string().url('Enter a valid page URL'),
  clientId:  z.string().min(1, 'Select a client workspace'),
})

type FormValues = z.infer<typeof schema>

interface AddCompetitorModalProps {
  onClose: () => void
}

export function AddCompetitorModal({ onClose }: AddCompetitorModalProps) {
  const { data: clients, isLoading: clientsLoading } = useClients()
  const addCompetitor = useAddCompetitor()
  const toast         = useToast()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:     '',
      platform: 'FACEBOOK',
      pageUrl:  '',
      clientId: '',
    },
  })

  const selectedPlatform = watch('platform')
  const selectedClientId = watch('clientId')

  const onSubmit = async (values: FormValues) => {
    try {
      await addCompetitor.mutateAsync(values)
      toast.show('Competitor added ✓', 'success')
      onClose()
    } catch {
      toast.show('Failed to add competitor', 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.headerTitle}>Track competitor</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.body}>

            {/* Name */}
            <Input
              label="Competitor name"
              placeholder="Cafe Amazon"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Platform */}
            <div>
              <span className={styles.sectionLabel}>Platform</span>
              <div className={styles.platformGrid}>
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    className={cn(
                      styles.platformOption,
                      selectedPlatform === platform && styles.platformOptionActive
                    )}
                    onClick={() => setValue('platform', platform)}
                  >
                    <PlatformIcon platform={platform} size={15} />
                    {platform.charAt(0) + platform.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Page URL */}
            <Input
              label="Page URL"
              type="url"
              placeholder="https://facebook.com/cafeamazon"
              required
              error={errors.pageUrl?.message}
              {...register('pageUrl')}
            />
            <p className={styles.hint}>
              Enter the full URL of their Facebook or Instagram page.
              Pinnlo will sync follower counts and engagement data daily.
            </p>

            {/* Client */}
            <div>
              <span className={styles.sectionLabel}>Compare against client</span>
              {clientsLoading ? (
                <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
                  Loading clients...
                </p>
              ) : (
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <div className={styles.clientGrid}>
                      {clients?.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className={cn(
                            styles.clientOption,
                            field.value === client.id && styles.clientOptionActive
                          )}
                          onClick={() => field.onChange(client.id)}
                        >
                          <span className={styles.clientDot} />
                          {client.name}
                        </button>
                      ))}
                    </div>
                  )}
                />
              )}
              {errors.clientId && (
                <p className={styles.formError}>{errors.clientId.message}</p>
              )}
            </div>

          </div>

          <div className={styles.footer}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Track competitor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}