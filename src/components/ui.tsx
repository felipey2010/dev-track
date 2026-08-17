import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress as ProgressBar } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className='mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end'>
      <div>
        {eyebrow && (
          <p className='mb-1 text-[10px] font-bold tracking-[.16em] text-cyan-600 dark:text-cyan-400'>
            {eyebrow}
          </p>
        )}
        <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      </div>
      {action}
    </div>
  )
}
export function StatusBadge({ value }: { value: string }) {
  const style = value.includes('CONCLU')
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : value.includes('TEST')
      ? 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400'
      : value.includes('DESENV')
        ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'border-border bg-muted/40 text-muted-foreground'
  return (
    <Badge
      variant='outline'
      className={cn(
        'gap-1.5 rounded-sm px-2 py-1 text-[10px] font-medium',
        style
      )}
    >
      <span className='size-1.5 rounded-full bg-current' />
      {value}
    </Badge>
  )
}
export function Progress({ value }: { value: number }) {
  return (
    <div className='flex min-w-28 items-center gap-3'>
      <ProgressBar value={value} className='h-1.5' />
      <span className='w-8 font-mono text-base text-muted-foreground'>
        {value}%
      </span>
    </div>
  )
}
export function ProjectLink({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <Link
      className='font-semibold text-foreground transition-colors hover:text-cyan-600 dark:hover:text-cyan-400'
      href={`/projects/${id}`}
    >
      {children}
    </Link>
  )
}
