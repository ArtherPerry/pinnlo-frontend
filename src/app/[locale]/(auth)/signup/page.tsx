'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui'
import { Input }  from '@/components/ui'
import api from '@/lib/api'
import styles from './signup.module.css'

const schema = z.object({
  agencyName: z.string().min(2, 'Agency name must be at least 2 characters'),
  email:      z.string().email('Enter a valid email address'),
  password:   z.string().min(8, 'Password must be at least 8 characters'),
  confirm:    z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path:    ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const t      = useTranslations('auth')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/api/v1/auth/signup', {
        agencyName: data.agencyName,
        email:      data.email,
        password:   data.password,
      })
      router.push(`/${locale}/login?verified=false`)
    } catch {
      setError('root', { message: 'Signup failed. Please try again.' })
    }
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{t('signup')}</h2>
      <p className={styles.sub}>Create your Pinnalo agency account</p>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label={t('agency_name')}
          type="text"
          placeholder="My Marketing Agency"
          error={errors.agencyName?.message}
          {...register('agencyName')}
        />

        <Input
          label={t('email')}
          type="email"
          placeholder="you@agency.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={t('password')}
          type="password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        {errors.root && (
          <p className={styles.rootError}>{errors.root.message}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          full
          loading={isSubmitting}
        >
          {t('signup')}
        </Button>
      </form>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link href={`/${locale}/login`}>{t('login')}</Link>
      </p>

      <p className={styles.terms}>
        By signing up you agree to Pinnalo&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}