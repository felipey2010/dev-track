import { auth } from '@/auth'
import { AuthPanel } from '@/components/auth/auth-panel'
import { TimedNotification } from '@/components/auth/timed-notification'
import { USER_STATUS } from '@/lib/auth/constants'
import { redirect } from 'next/navigation'
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordReset?: string | string[] }>
}) {
  const session = await auth()
  const query = await searchParams

  if (session?.user) {
    if (session.user.status === USER_STATUS.ACTIVE) redirect('/dashboard')
    if (session.user.status === USER_STATUS.PENDING)
      redirect('/account/pending')
    if (session.user.status === USER_STATUS.SUSPENDED)
      redirect('/account/suspended')
  }

  const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ENABLED)

  return (
    <>
      {query.passwordReset === 'success' && (
        <TimedNotification
          variant='success'
          className='mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center'
        >
          Senha redefinida com sucesso. Você já pode entrar.
        </TimedNotification>
      )}
      <AuthPanel googleEnabled={googleEnabled} />
    </>
  )
}
