import { Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import AuthField from './auth-field'
import AuthHeader from './auth-header'
import GoogleButton from './google-button'

function LoginForm({
  onRegister,
  googleEnabled,
}: {
  onRegister: () => void
  googleEnabled: boolean
}) {
  const router = useRouter()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string>()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(undefined)
    const form = new FormData(event.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setPending(false)
    if (result?.error) {
      setMessage('E-mail ou senha inválidos.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className='mt-8 flex flex-col gap-4'>
      <AuthHeader
        title='Acessar a sua conta'
        description='Use seu e-mail e senha para continuar.'
      />
      <AuthField label='E-mail'>
        <Input
          name='email'
          type='email'
          autoComplete='email'
          placeholder='voce@empresa.com'
          required
        />
      </AuthField>
      <AuthField
        label='Senha'
        aside={
          <Link href='/forgot-password' className='text-xs text-primary'>
            Esqueci minha senha
          </Link>
        }
      >
        <div className='relative'>
          <Input
            name='password'
            type={passwordVisible ? 'text' : 'password'}
            autoComplete='current-password'
            required
            className='pr-10'
          />
          <button
            type='button'
            onClick={() => setPasswordVisible((value) => !value)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {passwordVisible ? (
              <EyeOff className='size-4' />
            ) : (
              <Eye className='size-4' />
            )}
          </button>
        </div>
      </AuthField>
      {message && (
        <p role='alert' className='text-xs text-destructive'>
          {message}
        </p>
      )}
      <Button size='lg' className='w-full' disabled={pending} type='submit'>
        {pending ? 'Entrando...' : 'Entrar'}
      </Button>
      {googleEnabled && <GoogleButton />}
      <p className='text-center text-xs text-muted-foreground'>
        Não tem uma conta?{' '}
        <button type='button' onClick={onRegister} className='text-primary'>
          Criar conta
        </button>
      </p>
    </form>
  )
}

export default LoginForm
