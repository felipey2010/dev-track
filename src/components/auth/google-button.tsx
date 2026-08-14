import { signIn } from 'next-auth/react'
import { FcGoogle } from 'react-icons/fc'
import { Button } from '../ui/button'

export default function GoogleButton() {
  return (
    <>
      <div className='flex items-center gap-3 text-[10px] text-muted-foreground'>
        <span className='h-px flex-1 bg-border' />
        OU
        <span className='h-px flex-1 bg-border' />
      </div>
      <Button
        size='lg'
        type='button'
        variant='outline'
        className='w-full'
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      >
        <FcGoogle className='mr-1' /> Continuar com Google
      </Button>
    </>
  )
}
