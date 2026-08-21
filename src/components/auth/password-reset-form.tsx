'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { completePasswordReset } from '@/lib/client-api/auth'
import {
  passwordResetFormSchema,
  type PasswordResetInput,
} from '@/lib/auth/validation'
import { Button } from '@/components/ui/button'
import AuthField from './auth-field'
import AuthHeader from './auth-header'
import { PasswordInput } from './password-input'
import { TimedNotification } from './timed-notification'

export function PasswordResetForm({ resetId }: { resetId: string }) {
  const router = useRouter()
  const form = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetFormSchema),
    defaultValues: { resetId, password: '', passwordConfirmation: '' },
  })

  async function submit(values: PasswordResetInput) {
    form.clearErrors('root')
    try {
      const body = await completePasswordReset(values)
      if (!body.reset) throw new Error('INVALID_RESPONSE')
      router.replace('/login?passwordReset=success')
    } catch {
      form.setError('root', {
        message: 'Não foi possível redefinir a senha. Tente novamente.',
      })
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className='flex flex-col gap-4'
      noValidate
    >
      <AuthHeader
        title='Crie uma nova senha'
        description='Escolha uma senha com pelo menos oito caracteres, uma letra e um número.'
      />
      <input type='hidden' {...form.register('resetId')} />
      <AuthField
        label='Nova senha'
        htmlFor='new-password'
        error={form.formState.errors.password?.message}
      >
        <PasswordInput
          id='new-password'
          autoComplete='new-password'
          {...form.register('password')}
        />
      </AuthField>
      <AuthField
        label='Confirmar nova senha'
        htmlFor='confirm-password'
        error={form.formState.errors.passwordConfirmation?.message}
      >
        <PasswordInput
          id='confirm-password'
          autoComplete='new-password'
          {...form.register('passwordConfirmation')}
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
        {form.formState.isSubmitting ? 'Salvando...' : 'Redefinir senha'}
      </Button>
    </form>
  )
}
