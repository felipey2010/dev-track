import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { ApiResponse } from '@/lib/api'
import {
  registrationSchema,
  type RegistrationInput,
} from '@/lib/auth/validation'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import AuthField from './auth-field'
import AuthHeader from './auth-header'
import GoogleButton from './google-button'

function RegistrationForm({
  onLogin,
  googleEnabled,
}: {
  onLogin: () => void
  googleEnabled: boolean
}) {
  const router = useRouter()
  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      acceptedTerms: false,
    },
  })

  async function submit(values: RegistrationInput) {
    form.clearErrors('root')
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const body = (await response.json()) as ApiResponse<{ status: string }>
    if (!response.ok) {
      form.setError('root', { message: body.message })
      return
    }
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })
    if (result?.error) {
      form.setError('root', {
        message: 'Conta criada. Entre com suas credenciais.',
      })
      onLogin()
      return
    }
    router.push('/account/pending')
    router.refresh()
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className='mt-8 flex flex-col gap-4'
      noValidate
    >
      <AuthHeader
        title='Criar conta'
        description='Sua conta ficará pendente de aprovação antes do primeiro acesso.'
      />
      <AuthField
        label='Nome completo'
        htmlFor='register-name'
        error={form.formState.errors.name?.message}
      >
        <Input
          id='register-name'
          autoComplete='name'
          placeholder='Seu nome'
          {...form.register('name')}
        />
      </AuthField>
      <AuthField
        label='E-mail'
        htmlFor='register-email'
        error={form.formState.errors.email?.message}
      >
        <Input
          id='register-email'
          type='email'
          autoComplete='email'
          placeholder='voce@empresa.com'
          {...form.register('email')}
        />
      </AuthField>
      <AuthField
        label='Senha'
        htmlFor='register-password'
        error={form.formState.errors.password?.message}
      >
        <Input
          id='register-password'
          type='password'
          autoComplete='new-password'
          placeholder='Mínimo de 8 caracteres'
          {...form.register('password')}
        />
      </AuthField>
      <AuthField
        label='Confirmar senha'
        htmlFor='register-confirmation'
        error={form.formState.errors.passwordConfirmation?.message}
      >
        <Input
          id='register-confirmation'
          type='password'
          autoComplete='new-password'
          {...form.register('passwordConfirmation')}
        />
      </AuthField>
      <label className='flex items-start gap-2 text-xs leading-5 text-muted-foreground'>
        <input
          type='checkbox'
          className='mt-1 size-3.5 accent-primary'
          {...form.register('acceptedTerms')}
        />
        <span>
          Concordo com os{' '}
          <Link href='/terms' className='text-primary'>
            termos de uso
          </Link>{' '}
          e a{' '}
          <Link href='/privacy' className='text-primary'>
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {form.formState.errors.acceptedTerms?.message && (
        <p className='text-xs text-destructive'>
          {form.formState.errors.acceptedTerms.message}
        </p>
      )}
      {form.formState.errors.root?.message && (
        <p role='alert' className='text-xs text-destructive'>
          {form.formState.errors.root.message}
        </p>
      )}
      <Button
        size='lg'
        className='w-full'
        disabled={form.formState.isSubmitting}
        type='submit'
      >
        {form.formState.isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </Button>
      {googleEnabled && <GoogleButton />}
      <p className='text-center text-xs text-muted-foreground'>
        Já tem uma conta?{' '}
        <button type='button' onClick={onLogin} className='text-primary'>
          Entrar
        </button>
      </p>
    </form>
  )
}
export default RegistrationForm
