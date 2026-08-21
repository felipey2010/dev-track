import { signIn } from 'next-auth/react'
import { FcGoogle } from 'react-icons/fc'
import { Button } from '../ui/button'

export default function GoogleButton() {
  return (
    <>
      <div className='my-1 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground'>
        <span className='h-px flex-1 bg-border' />
        OU
        <span className='h-px flex-1 bg-border' />
      </div>
      <Button
        size='lg'
        type='button'
        variant='outline'
        className='h-12 w-full'
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      >
        <FcGoogle className='mr-1' /> Continuar com Google
      </Button>
    </>
  )
}
