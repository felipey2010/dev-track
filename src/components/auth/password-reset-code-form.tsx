'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { ApiResponse } from '@/lib/api'
import {
  passwordResetCodeSchema,
  type PasswordResetCodeInput,
} from '@/lib/auth/validation'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthField from './auth-field'
import AuthHeader from './auth-header'
import { RecaptchaConsent } from './recaptcha-consent'
import { useRecaptchaToken } from './use-recaptcha-token'
import { TimedNotification } from './timed-notification'

export function PasswordResetCodeForm({ resetId }: { resetId: string }) {
  const router = useRouter()
  const getRecaptchaToken = useRecaptchaToken()
  const form = useForm<PasswordResetCodeInput>({
    resolver: zodResolver(passwordResetCodeSchema),
    defaultValues: { resetId, code: '' },
  })

  async function submit(values: PasswordResetCodeInput) {
    form.clearErrors('root')
    try {
      const recaptchaToken = await getRecaptchaToken(
        RECAPTCHA_ACTIONS.passwordResetVerify
      )
      const response = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, recaptchaToken }),
      })
      const body = (await response.json()) as ApiResponse<{ verified: boolean }>
      if (!response.ok || !body.data?.verified) {
        form.setError('root', { message: body.message })
        return
      }
      router.replace(`/forgot-password/reset?id=${encodeURIComponent(resetId)}`)
    } catch {
      form.setError('root', {
        message: 'Não foi possível verificar o código. Tente novamente.',
      })
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className='mt-7 flex flex-col gap-4'
      noValidate
    >
      <AuthHeader
        title='Informe o código'
        description='Digite o código de seis dígitos enviado ao e-mail informado.'
      />
      <input type='hidden' {...form.register('resetId')} />
      <AuthField
        label='Código de verificação'
        htmlFor='reset-code'
        error={form.formState.errors.code?.message}
      >
        <Input
          id='reset-code'
          inputMode='numeric'
          autoComplete='one-time-code'
          maxLength={6}
          placeholder='000000'
          className='text-center font-mono text-lg tracking-[0.45em]'
          {...form.register('code')}
        />
      </AuthField>
      {form.formState.errors.root?.message && (
        <TimedNotification onDismiss={() => form.clearErrors('root')}>
          {form.formState.errors.root.message}
        </TimedNotification>
      )}
      <Button size='lg' type='submit' disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Verificando...' : 'Verificar código'}
      </Button>
      <RecaptchaConsent />
    </form>
  )
}
