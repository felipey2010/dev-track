'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className='relative'>
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
      />
      <button
        type='button'
        onClick={() => setVisible((value) => !value)}
        className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
      </button>
    </div>
  )
}
