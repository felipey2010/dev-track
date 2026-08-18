'use client'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

type Props = {
  text?: string
  className?: string
}

function GoBack({ text = 'Voltar', className }: Props) {
  const router = useRouter()

  return (
    <div className={cn('mb-2', className)}>
      <Button onClick={() => router.back()}>
        <ArrowLeft className='mr-2' /> {text}
      </Button>
    </div>
  )
}

export default GoBack
