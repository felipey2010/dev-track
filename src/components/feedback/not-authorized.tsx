import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export function NotAuthorized() {
  return (
    <div className='mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center'>
      <Card className='w-full border-amber-500/30 bg-amber-500/5'>
        <CardContent className='flex flex-col items-center px-6 py-12 text-center'>
          <div className='mb-5 flex size-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300'>
            <ShieldAlert className='size-8' aria-hidden='true' />
          </div>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300'>
            Acesso restrito
          </p>
          <h1 className='mt-3 font-heading text-3xl font-semibold'>
            Você não tem autorização
          </h1>
          <p className='mt-3 max-w-md text-sm leading-6 text-muted-foreground'>
            Esta página está disponível apenas para administradores do sistema.
          </p>
          <Link
            href='/dashboard'
            className={buttonVariants({ className: 'mt-7', size: 'lg' })}
          >
            Voltar ao painel
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
