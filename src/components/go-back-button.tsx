'use client'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

type Props = {
  buttonText?: string
  page?: string
  className?: string
}

function GoBack({ buttonText = 'Voltar', page, className }: Props) {
  const router = useRouter()

  return (
    <div className={cn('flex flex-col gap-3 mb-3', className)}>
      <Button
        type='button'
        size='lg'
        onClick={() => router.back()}
        className='w-fit'
      >
        <ArrowLeft /> {buttonText}
      </Button>
      {page && (
        <p className='font-mono text-[10px] text-muted-foreground'>{page}</p>
      )}
    </div>
  )
}

export default GoBack
