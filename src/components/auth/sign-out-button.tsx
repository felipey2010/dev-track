'use client'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import useIsMobile from '@/hooks/use-mobile'

export function SignOutButton() {
  const isMobile = useIsMobile()

  return (
    <Button
      variant={isMobile ? 'ghost' : 'outline'}
      size='icon'
      className='sm:w-auto sm:px-4'
      aria-label='Sair'
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      <LogOut className='size-4' />
      <span className='hidden sm:inline'>Sair</span>
    </Button>
  )
}
