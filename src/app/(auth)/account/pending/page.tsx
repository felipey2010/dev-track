import { auth } from '@/auth'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { USER_STATUS } from '@/lib/auth/constants'
import { Clock3 } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Conta pendente',
  description: 'Sua conta aguarda aprovação administrativa.',
}

export default async function PendingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.status === USER_STATUS.ACTIVE) redirect('/dashboard')
  if (session.user.status === USER_STATUS.SUSPENDED)
    redirect('/account/suspended')

  return (
    <div className='mt-10 rounded-lg border bg-card p-6 text-center'>
      <span className='mx-auto grid size-11 place-items-center rounded-full bg-amber-500/10 text-amber-500'>
        <Clock3 className='size-5' />
      </span>
      <h1 className='mt-4 text-lg font-semibold'>Aguardando aprovação</h1>
      <p className='mt-2 text-xs leading-5 text-muted-foreground'>
        Sua identidade foi confirmada, mas um administrador precisa aprovar a
        conta antes do acesso aos projetos.
      </p>
      <div className='mt-6'>
        <SignOutButton />
      </div>
    </div>
  )
}
