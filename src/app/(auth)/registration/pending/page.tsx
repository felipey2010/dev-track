import { buttonVariants } from '@/components/ui/button'
import { AuthCard } from '@/components/auth/auth-card'
import { CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cadastro confirmado',
  description: 'Seu e-mail foi confirmado e a conta aguarda aprovação.',
}

export default function RegistrationPendingPage() {
  return (
    <AuthCard className='text-center'>
      <span className='mx-auto grid size-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-500'>
        <CheckCircle2 className='size-5' />
      </span>
      <h1 className='mt-5 text-xl font-bold'>E-mail confirmado</h1>
      <p className='mt-2 text-[13px] leading-5 text-muted-foreground'>
        Sua identidade foi confirmada. Agora aguarde a aprovação de um
        administrador antes de acessar os projetos.
      </p>
      <Link
        href='/login'
        className={buttonVariants({ variant: 'outline', className: 'mt-6' })}
      >
        Voltar para entrar
      </Link>
    </AuthCard>
  )
}
