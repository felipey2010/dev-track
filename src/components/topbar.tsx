import { SignOutButton } from '@/components/auth/sign-out-button'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { APP_IDENTITY } from '@/lib/app-identity'

export default function Topbar() {
  return (
    <header className='sticky top-0 z-40 col-span-full flex h-14 items-center border-b bg-background/95 backdrop-blur'>
      <div className='flex h-full w-full items-center border-r px-4 md:w-54'>
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
      <div className='flex flex-1 items-center justify-between px-4 md:px-6 max-w-372'>
        <p className='hidden text-xs text-muted-foreground sm:block'>
          <span className='text-cyan-600 dark:text-cyan-400'>
            {APP_IDENTITY.name}
          </span>{' '}
          / Painel
        </p>
        <div className='ml-auto flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='relative text-muted-foreground'
            aria-label='Notificações'
          >
            <Bell className='size-4' />
            <span className='absolute right-2 top-2 size-1.5 rounded-full bg-amber-400' />
          </Button>
          <ThemeToggle />
          <div className='ml-2 hidden items-center gap-2 border-l pl-3 sm:flex'>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
