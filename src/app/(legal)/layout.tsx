import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { APP_IDENTITY } from '@/lib/app-identity'

function LegalPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-dvh flex-col bg-muted/20'>
      <header className='sticky top-0 z-40 col-span-full flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px:4 sm:px-8'>
        <div className='flex h-full w-full items-center px-4 md:w-54'>
          <Link href='/dashboard' className='flex items-center gap-2.5'>
            <Image
              src={APP_IDENTITY.logoPath}
              alt={APP_IDENTITY.name}
              width={28}
              height={28}
            />
            <div>
              <strong className='block text-sm leading-none'>
                {APP_IDENTITY.name}
              </strong>
              <span className='mt-1 block font-mono text-[8px] uppercase tracking-[.2em] text-muted-foreground'>
                {APP_IDENTITY.subtitle}
              </span>
            </div>
          </Link>
        </div>
        <Link
          href='/dashboard'
          className='flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft size={15} />
          Voltar ao sistema
        </Link>
      </header>
      {children}
      <footer className='flex flex-col gap-3 border-t bg-card px-4 py-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8'>
        <span>© 2026 {APP_IDENTITY.name}</span>
        <nav className='flex gap-5'>
          <Link href='/privacy' className='hover:text-foreground'>
            Política de Privacidade
          </Link>
          <Link href='/terms' className='hover:text-foreground'>
            Termos de Serviço
          </Link>
        </nav>
      </footer>
    </div>
  )
}

export default LegalPageLayout
