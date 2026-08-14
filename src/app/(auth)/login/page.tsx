import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AuthPanel } from '@/components/auth/auth-panel'
export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    if (session.user.status === 'ACTIVE') redirect('/dashboard')
    if (session.user.status === 'PENDING') redirect('/account/pending')
    if (session.user.status === 'SUSPENDED') redirect('/account/suspended')
  }

  const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ENABLED)

  return <AuthPanel googleEnabled={googleEnabled} />
}
