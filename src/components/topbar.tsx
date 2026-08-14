import { Bell } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'

type CurrentUser = {
  name: string
  email: string
  image: string | null
  system_role: 'ADMIN' | 'USER'
}
export default function Topbar({ user }: { user: CurrentUser }) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return (
    <header className='sticky top-0 z-40 col-span-full flex h-14 items-center border-b bg-background/95 backdrop-blur'>
      <div className='flex h-full w-full items-center border-r px-4 md:w-[216px]'>
        <Link href='/dashboard' className='flex items-center gap-2.5'>
          <Image
            src='/assets/images/logo.png'
            alt='Dev Track'
            width={28}
            height={28}
          />
          <div>
            <strong className='block text-sm leading-none'>Dev Track</strong>
            <span className='mt-1 block font-mono text-[8px] uppercase tracking-[.2em] text-muted-foreground'>
              Engenharia · Interno
            </span>
          </div>
        </Link>
      </div>
      <div className='flex flex-1 items-center justify-between px-4 md:px-6'>
        <p className='hidden text-xs text-muted-foreground sm:block'>
          <span className='text-cyan-600 dark:text-cyan-400'>Dev Track</span> /
          Painel
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
            <Avatar className='size-8'>
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className='text-[10px]'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='max-w-32'>
              <strong className='block truncate text-[10px]'>
                {user.name}
              </strong>
              <span className='block truncate text-[9px] text-muted-foreground'>
                {user.system_role}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
