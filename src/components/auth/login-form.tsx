import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { credentialsSchema, type CredentialsInput } from '@/lib/auth/validation'
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
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  })

  async function submit(values: CredentialsInput) {
    form.clearErrors('root')
    const result = await signIn('credentials', { ...values, redirect: false })

    if (result?.error) {
      form.setError('root', { message: 'E-mail ou senha inválidos.' })
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className='mt-8 flex flex-col gap-4'
      noValidate
    >
      <AuthHeader
        title='Acessar a sua conta'
        description='Use seu e-mail e senha para continuar.'
      />
      <AuthField
        label='E-mail'
        htmlFor='login-email'
        error={form.formState.errors.email?.message}
      >
        <Input
          id='login-email'
          type='email'
          autoComplete='email'
          placeholder='voce@empresa.com'
          {...form.register('email')}
        />
      </AuthField>
      <AuthField
        label='Senha'
        htmlFor='login-password'
        error={form.formState.errors.password?.message}
        aside={
          <Link href='/forgot-password' className='text-xs text-primary'>
            Esqueci minha senha
          </Link>
        }
      >
        <div className='relative'>
          <Input
            id='login-password'
            type={passwordVisible ? 'text' : 'password'}
            autoComplete='current-password'
            className='pr-10'
            {...form.register('password')}
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
        {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
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
