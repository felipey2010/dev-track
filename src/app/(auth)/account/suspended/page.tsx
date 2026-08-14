import { redirect } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import { auth } from '@/auth'
import { SignOutButton } from '@/components/auth/sign-out-button'
export default async function SuspendedPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.status === 'ACTIVE') redirect('/dashboard')
  if (session.user.status === 'PENDING') redirect('/account/pending')
  return (
    <div className='mt-10 rounded-lg border bg-card p-6 text-center'>
      <span className='mx-auto grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive'>
        <ShieldX className='size-5' />
      </span>
      <h1 className='mt-4 text-lg font-semibold'>Acesso suspenso</h1>
      <p className='mt-2 text-xs leading-5 text-muted-foreground'>
        Esta conta não pode acessar as funcionalidades protegidas. Entre em
        contato com o administrador da sua organização.
      </p>
      <div className='mt-6'>
        <SignOutButton />
      </div>
    </div>
  )
}
