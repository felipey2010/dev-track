'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { ApiResponse } from '@/lib/api'
import {
  passwordResetRequestFormSchema,
  type PasswordResetRequestInput,
} from '@/lib/auth/validation'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthField from './auth-field'
import AuthHeader from './auth-header'
import { RecaptchaConsent } from './recaptcha-consent'
import { useRecaptchaToken } from './use-recaptcha-token'
import { TimedNotification } from './timed-notification'

export function PasswordResetRequestForm() {
  const router = useRouter()
  const getRecaptchaToken = useRecaptchaToken()
  const form = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestFormSchema),
    defaultValues: { email: '' },
  })

  async function submit(values: PasswordResetRequestInput) {
    form.clearErrors('root')
    try {
      const recaptchaToken = await getRecaptchaToken(
        RECAPTCHA_ACTIONS.passwordResetRequest
      )
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, recaptchaToken }),
      })

      const body = (await response.json()) as ApiResponse<{ resetId: string }>

      if (!response.ok || !body.data?.resetId) {
        form.setError('root', { message: body.message })
        return
      }

      router.push(
        `/forgot-password/verify?id=${encodeURIComponent(body.data.resetId)}`
      )
    } catch {
      form.setError('root', {
        message: 'Não foi possível iniciar a redefinição. Tente novamente.',
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
        title='Redefinir senha'
        description='Informe seu e-mail. Se houver uma conta correspondente, enviaremos um código de verificação.'
      />
      <AuthField
        label='E-mail'
        htmlFor='reset-email'
        error={form.formState.errors.email?.message}
      >
        <Input
          id='reset-email'
          type='email'
          autoComplete='email'
          placeholder='voce@empresa.com'
          {...form.register('email')}
        />
      </AuthField>
      {form.formState.errors.root?.message && (
        <TimedNotification onDismiss={() => form.clearErrors('root')}>
          {form.formState.errors.root.message}
        </TimedNotification>
      )}
      <Button size='lg' type='submit' disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Enviando...' : 'Enviar código'}
      </Button>
      <RecaptchaConsent />
    </form>
  )
}
