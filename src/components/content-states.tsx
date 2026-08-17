import { Skeleton } from './ui/skeleton'

export function Loading() {
  return (
    <div className='flex flex-col gap-2 p-4'>
      <Skeleton className='h-10' />
      <Skeleton className='h-10' />
    </div>
  )
}

export function State({ text, error }: { text: string; error?: boolean }) {
  return (
    <div
      className={`p-6 text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {text}
    </div>
  )
}
