import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className='flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-foreground'>
      <Card className='w-full max-w-2xl border-dashed'>
        <CardContent className='flex flex-col items-center px-6 py-14 text-center'>
          <div className='mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <FileQuestion className='size-8' aria-hidden='true' />
          </div>
          <p className='font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground'>
            Erro 404
          </p>
          <h1 className='mt-3 font-heading text-3xl font-semibold sm:text-4xl'>
            Página não encontrada
          </h1>
          <p className='mt-3 max-w-md text-sm leading-6 text-muted-foreground'>
            O endereço informado não existe ou a página foi movida.
          </p>
          <Link href='/' className={buttonVariants({ className: 'mt-7' })}>
            Ir para o início
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
