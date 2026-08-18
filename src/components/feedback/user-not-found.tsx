import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserRoundX } from 'lucide-react'
import Link from 'next/link'

export function UserNotFound() {
  return (
    <div className='mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center'>
      <Card className='w-full border-dashed'>
        <CardContent className='flex flex-col items-center px-6 py-12 text-center'>
          <div className='mb-5 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <UserRoundX className='size-8' aria-hidden='true' />
          </div>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground'>
            Usuário não encontrado
          </p>
          <h1 className='mt-3 font-heading text-3xl font-semibold'>
            Não encontramos este usuário
          </h1>
          <p className='mt-3 max-w-md text-sm leading-6 text-muted-foreground'>
            O endereço pode estar incorreto ou o usuário pode ter sido removido.
          </p>
          <Link
            href='/dashboard'
            className={buttonVariants({ className: 'mt-7' })}
          >
            Voltar ao painel
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
