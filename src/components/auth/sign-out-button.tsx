'use client'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
export function SignOutButton() {
  return (
    <Button
      variant='outline'
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
