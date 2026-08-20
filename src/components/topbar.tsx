import { SignOutButton } from '@/components/auth/sign-out-button'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { APP_IDENTITY } from '@/lib/app-identity'
import { NotificationBell } from '@/components/notifications/notification-bell'

export default function Topbar() {
  return (
    <header className='z-40 col-span-full flex h-14 items-center border-b bg-background/95 backdrop-blur'>
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
          <NotificationBell />
          <ThemeToggle />
          <div className='sm:ml-2 sm:border-l sm:pl-3'>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
