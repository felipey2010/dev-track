import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { loginFormSchema, type CredentialsInput } from '@/lib/auth/validation'
import {
  RECAPTCHA_ACTIONS,
  RECAPTCHA_ERROR_CODE,
} from '@/lib/recaptcha/constants'
import { RATE_LIMIT_ERROR_CODE } from '@/lib/auth/constants'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import AuthField from './auth-field'
import AuthHeader from './auth-header'
import GoogleButton from './google-button'
import { RecaptchaConsent } from './recaptcha-consent'
import { useRecaptchaToken } from './use-recaptcha-token'
import { TimedNotification } from './timed-notification'
import { PasswordInput } from './password-input'

function LoginForm({
  onRegister,
  googleEnabled,
}: {
  onRegister: () => void
  googleEnabled: boolean
}) {
  const router = useRouter()
  const getRecaptchaToken = useRecaptchaToken()
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  async function submit(values: CredentialsInput) {
    form.clearErrors('root')
    try {
      const recaptchaToken = await getRecaptchaToken(RECAPTCHA_ACTIONS.login)
      const result = await signIn('credentials', {
        ...values,
        recaptchaToken,
        redirect: false,
      })
      if (result?.code === RECAPTCHA_ERROR_CODE) {
        form.setError('root', {
          message:
            'Não foi possível confirmar a verificação de segurança. Tente novamente.',
        })
        return
      }
      if (result?.code === RATE_LIMIT_ERROR_CODE) {
        form.setError('root', {
          message:
            'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        })
        return
      }
      if (result?.error) {
        form.setError('root', { message: 'E-mail ou senha inválidos.' })
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      form.setError('root', {
        message:
          'A verificação de segurança está indisponível. Tente novamente.',
      })
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className='mt-6 flex flex-col gap-4'
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
        <PasswordInput
          id='login-password'
          autoComplete='current-password'
          placeholder='Digite sua senha'
          {...form.register('password')}
        />
      </AuthField>
      {form.formState.errors.root?.message && (
        <TimedNotification onDismiss={() => form.clearErrors('root')}>
          {form.formState.errors.root.message}
        </TimedNotification>
      )}
      <Button
        size='lg'
        className='h-12 w-full text-[14px] font-bold'
        disabled={form.formState.isSubmitting}
        type='submit'
      >
        {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
      <RecaptchaConsent />
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
