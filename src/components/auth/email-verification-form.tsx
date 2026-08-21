'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  resendRegistrationCode,
  verifyRegistrationEmail,
} from '@/lib/client-api/auth'
import {
  emailVerificationSchema,
  type EmailVerificationInput,
} from '@/lib/auth/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthField from './auth-field'
import AuthHeader from './auth-header'
import { useRecaptchaToken } from './use-recaptcha-token'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { TimedNotification } from './timed-notification'

export function EmailVerificationForm({
  verificationId,
}: {
  verificationId: string
}) {
  const router = useRouter()
  const getRecaptchaToken = useRecaptchaToken()
  const [resendMessage, setResendMessage] = useState<string>()
  const [isResending, setIsResending] = useState(false)
  const form = useForm<EmailVerificationInput>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { verificationId, code: '' },
  })

  async function submit(values: EmailVerificationInput) {
    form.clearErrors('root')
    try {
      const body = await verifyRegistrationEmail(values)
      if (!body.verified) throw new Error('INVALID_RESPONSE')
      router.replace('/registration/pending')
    } catch {
      form.setError('root', {
        message: 'Não foi possível verificar o código. Tente novamente.',
      })
    }
  }

  async function resend() {
    setIsResending(true)
    setResendMessage(undefined)
    try {
      const recaptchaToken = await getRecaptchaToken(
        RECAPTCHA_ACTIONS.emailVerificationResend
      )
      await resendRegistrationCode({ verificationId, recaptchaToken })
      setResendMessage('Um novo código foi enviado.')
    } catch {
      setResendMessage('Não foi possível reenviar o código. Tente novamente.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className='flex flex-col gap-4'
      noValidate
    >
      <AuthHeader
        title='Confirme seu e-mail'
        description='Enviamos um código de 6 dígitos para seu e-mail. Ele é válido por 10 minutos.'
      />
      <input type='hidden' {...form.register('verificationId')} />
      <AuthField
        label='Código de verificação'
        htmlFor='verification-code'
        error={form.formState.errors.code?.message}
      >
        <Input
          id='verification-code'
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
      <Button
        className='h-12 font-bold'
        size='lg'
        type='submit'
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Verificando...' : 'Verificar e-mail'}
      </Button>
      <button
        type='button'
        className='text-xs text-primary disabled:opacity-50'
        onClick={resend}
        disabled={isResending}
      >
        {isResending ? 'Reenviando...' : 'Não recebeu? Reenviar código'}
      </button>
      {resendMessage && (
        <TimedNotification
          variant='neutral'
          className='text-center'
          onDismiss={() => setResendMessage(undefined)}
        >
          {resendMessage}
        </TimedNotification>
      )}
    </form>
  )
}
