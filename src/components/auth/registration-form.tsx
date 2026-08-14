import { ApiResponse } from '@/lib/api'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
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
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string>()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(undefined)
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        passwordConfirmation: form.get('passwordConfirmation'),
        acceptedTerms: form.get('acceptedTerms') === 'on',
      }),
    })

    const body = (await response.json()) as ApiResponse<{ status: string }>
    if (!response.ok) {
      setPending(false)
      setMessage(body.message)
      return
    }

    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setPending(false)
    if (result?.error) {
      setMessage('Conta criada. Entre com suas credenciais.')
      onLogin()
      return
    }
    router.push('/account/pending')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className='mt-8 flex flex-col gap-4'>
      <AuthHeader
        title='Criar conta'
        description='Sua conta ficará pendente de aprovação antes do primeiro acesso.'
      />
      <AuthField label='Nome completo'>
        <Input
          name='name'
          autoComplete='name'
          placeholder='Seu nome'
          required
        />
      </AuthField>
      <AuthField label='E-mail'>
        <Input
          name='email'
          type='email'
          autoComplete='email'
          placeholder='voce@empresa.com'
          required
        />
      </AuthField>
      <AuthField label='Senha'>
        <Input
          name='password'
          type='password'
          autoComplete='new-password'
          placeholder='Mínimo de 8 caracteres'
          required
        />
      </AuthField>
      <AuthField label='Confirmar senha'>
        <Input
          name='passwordConfirmation'
          type='password'
          autoComplete='new-password'
          required
        />
      </AuthField>
      <label className='flex items-start gap-2 text-xs leading-5 text-muted-foreground'>
        <input
          name='acceptedTerms'
          type='checkbox'
          className='mt-1 size-3.5 accent-primary'
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
      {message && (
        <p role='alert' className='text-xs text-destructive'>
          {message}
        </p>
      )}
      <Button size='lg' className='w-full' disabled={pending}>
        {pending ? 'Criando conta...' : 'Criar conta'}
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
