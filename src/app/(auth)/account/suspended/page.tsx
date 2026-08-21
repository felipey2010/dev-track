import { auth } from '@/auth'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { AuthCard } from '@/components/auth/auth-card'
import { USER_STATUS } from '@/lib/auth/constants'
import { ShieldX } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Conta suspensa',
  description: 'O acesso desta conta ao Dev Track está suspenso.',
}

export default async function SuspendedPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.status === USER_STATUS.ACTIVE) redirect('/dashboard')
  if (session.user.status === USER_STATUS.PENDING) redirect('/account/pending')

  return (
    <AuthCard className='text-center'>
      <span className='mx-auto grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive'>
        <ShieldX className='size-5' />
      </span>
      <h1 className='mt-5 text-xl font-bold'>Acesso suspenso</h1>
      <p className='mt-2 text-[13px] leading-5 text-muted-foreground'>
        Esta conta não pode acessar as funcionalidades protegidas. Entre em
        contato com o administrador da sua organização.
      </p>
      <div className='mt-6'>
        <SignOutButton />
      </div>
    </AuthCard>
  )
}
