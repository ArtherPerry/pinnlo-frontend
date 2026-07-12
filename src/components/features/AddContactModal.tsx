'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, PlatformIcon } from '@/components/ui'
import { useClients } from '@/hooks/useClients'
import { useCreateContact } from '@/hooks/useContacts'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { ContactSource, Platform } from '@/lib/types'
import styles from './AddContactModal.module.css'

const SOURCE_OPTIONS: {
  value: ContactSource
  label: string
  platform: Platform | null
}[] = [
  { value: 'MANUAL',    label: 'Manual',    platform: null        },
  { value: 'MESSENGER', label: 'Messenger', platform: 'FACEBOOK'  },
  { value: 'WHATSAPP',  label: 'WhatsApp',  platform: 'WHATSAPP'  },
  { value: 'LINE',      label: 'LINE',      platform: 'LINE'      },
]

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  phone:    z.string().optional(),
  email:    z.string().email('Enter a valid email').optional().or(z.literal('')),
  clientId: z.string().min(1, 'Select a client workspace'),
  source:   z.string().min(1, 'Select a source'),
  tags:     z.string().optional(),
  notes:    z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AddContactModalProps {
  onClose: () => void
}

export function AddContactModal({ onClose }: AddContactModalProps) {
  const { data: clients, isLoading: clientsLoading } = useClients()
  const createContact = useCreateContact()
  const toast         = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:     '',
      phone:    '',
      email:    '',
      clientId: '',
      source:   'MANUAL',
      tags:     '',
      notes:    '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createContact.mutateAsync({
        name:      values.name,
        phone:     values.phone || undefined,
        email:     values.email || undefined,
        clientId:  values.clientId,
        source:    values.source as ContactSource,
        tags:      values.tags
          ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        notes:     values.notes || undefined,
      })
      toast.show('Contact added ✓', 'success')
      onClose()
    } catch {
      toast.show('Failed to add contact', 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>Add contact</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.body}>

            {/* ── Name + Phone ── */}
            <div className={styles.row}>
              <Input
                label="Full name"
                placeholder="Sirinda Rattanapruk"
                required
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="+66 81 234 5678"
                hint="E.164 format preferred"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            {/* ── Email ── */}
            <Input
              label="Email address"
              type="email"
              placeholder="contact@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* ── Client ── */}
            <div>
              <span className={styles.sectionLabel}>Client workspace</span>
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

            {/* ── Source ── */}
            <div>
              <span className={styles.sectionLabel}>How did this contact reach you?</span>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <div className={styles.sourceGrid}>
                    {SOURCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          styles.sourceOption,
                          field.value === opt.value && styles.sourceOptionActive
                        )}
                        onClick={() => field.onChange(opt.value)}
                      >
                        {opt.platform && (
                          <PlatformIcon platform={opt.platform} size={14} />
                        )}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* ── Tags + Notes ── */}
            <Input
              label="Tags (comma separated)"
              type="text"
              placeholder="vip, interested, corporate"
              hint="Helps filter and segment contacts"
              {...register('tags')}
            />

            <div>
              <span className={styles.sectionLabel}>Notes</span>
              <textarea
                className={styles.textarea}
                placeholder="Any additional notes about this contact..."
                {...register('notes')}
              />
            </div>

          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
            >
              Add contact
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}