'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, PlatformIcon } from '@/components/ui'
import { useCreateClient, useUpdateClient, type Client } from '@/hooks/useClients'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import styles from './ClientFormModal.module.css'

/**
 * All five Platform values exist on the backend, but only Facebook and
 * Instagram have rules in MediaRules — the rest are deliberately undefined and
 * fail loudly at publish time. Offering them here would let someone select a
 * platform that cannot publish, so `selectable` gates what is rendered.
 * Flip the flag when the rules exist.
 */
const PLATFORMS: { value: string; label: string; selectable: boolean }[] = [
  { value: 'FACEBOOK',  label: 'Facebook',  selectable: true  },
  { value: 'INSTAGRAM', label: 'Instagram', selectable: true  },
  { value: 'TIKTOK',    label: 'TikTok',    selectable: false },
  { value: 'LINE',      label: 'LINE',      selectable: false },
  { value: 'WHATSAPP',  label: 'WhatsApp',  selectable: false },
]

const STATUSES = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'PAUSED',   label: 'Paused'   },
  { value: 'ARCHIVED', label: 'Archived' },
]

const schema = z.object({
  name:      z.string().min(2, 'Name must be at least 2 characters'),
  platforms: z.array(z.string()),
  status:    z.string().min(1, 'Select a status'),
})

type FormValues = z.infer<typeof schema>

interface ClientFormModalProps {
  /** Omit to create; pass a client to edit it. */
  client?: Client
  onClose: () => void
}

export function ClientFormModal({ client, onClose }: ClientFormModalProps) {
  const isEdit = Boolean(client)
  const toast  = useToast()

  const createClient = useCreateClient()
  const updateClient = useUpdateClient(client?.id ?? '')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:      client?.name      ?? '',
      platforms: client?.platforms ?? [],
      status:    client?.status    ?? 'ACTIVE',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateClient.mutateAsync(values)
        toast.show('Client updated', 'success')
      } else {
        await createClient.mutateAsync(values)
        toast.show('Client added', 'success')
      }
      onClose()
    } catch {
      toast.show(isEdit ? 'Failed to update client' : 'Failed to add client', 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {isEdit ? 'Edit client' : 'Add client'}
          </span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.body}>

            <Input
              label="Client name"
              placeholder="Bangkok Bistro"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <div>
              <span className={styles.sectionLabel}>Platforms</span>
              <Controller
                name="platforms"
                control={control}
                render={({ field }) => (
                  <div className={styles.platformGrid}>
                    {PLATFORMS.filter((p) => p.selectable).map((p) => {
                      const active = field.value.includes(p.value)
                      return (
                        <button
                          key={p.value}
                          type="button"
                          className={cn(
                            styles.platformOption,
                            active && styles.platformOptionActive,
                          )}
                          onClick={() =>
                            field.onChange(
                              active
                                ? field.value.filter((v) => v !== p.value)
                                : [...field.value, p.value],
                            )
                          }
                        >
                          <PlatformIcon platform={p.value as never} />
                          <span>{p.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              <p className={styles.hint}>
                Pages are connected separately, from the client&apos;s panel.
              </p>
            </div>

            <div>
              <span className={styles.sectionLabel}>Status</span>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className={styles.statusGrid}>
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={cn(
                          styles.statusOption,
                          field.value === s.value && styles.statusOptionActive,
                        )}
                        onClick={() => field.onChange(s.value)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.status?.message && (
                <span className={styles.formError}>{errors.status.message}</span>
              )}
            </div>

          </div>

          <div className={styles.footer}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEdit ? 'Save changes' : 'Add client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}