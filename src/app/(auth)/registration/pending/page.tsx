import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function RegistrationPendingPage() {
  return (
    <div className='mt-10 rounded-lg border bg-card p-6 text-center'>
      <span className='mx-auto grid size-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-500'>
        <CheckCircle2 className='size-5' />
      </span>
      <h1 className='mt-4 text-lg font-semibold'>E-mail confirmado</h1>
      <p className='mt-2 text-xs leading-5 text-muted-foreground'>
        Sua identidade foi confirmada. Agora aguarde a aprovação de um
        administrador antes de acessar os projetos.
      </p>
      <Link
        href='/login'
        className={buttonVariants({ variant: 'outline', className: 'mt-6' })}
      >
        Voltar para entrar
      </Link>
    </div>
  )
}
