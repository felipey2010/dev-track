import { Badge } from '@/components/ui/badge'
import { Progress as ProgressBar } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import Linkify from 'linkify-react'
import Link from 'next/link'

const linkifyOptions = {
  defaultProtocol: 'http',
  target: '_blank',
  rel: 'noopener noreferrer',
  className: 'text-blue-600 dark:text-blue-700 hover:underline break-all',
}

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
    <div className='mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end'>
      <div>
        {eyebrow && (
          <p className="mb-3 flex items-center gap-2 font-mono text-[7px] font-semibold uppercase tracking-[.18em] text-primary before:h-px before:w-3.5 before:bg-primary before:content-['']">
            {eyebrow}
          </p>
        )}
        <h1 className='text-[2rem] font-bold leading-none tracking-tight'>
          {title}
        </h1>
        <Linkify options={linkifyOptions}>
          <p className='mt-2 text-[15px] text-muted-foreground'>
            {description}
          </p>
        </Linkify>
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
        'gap-1.5 rounded-full border-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.03em]',
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
    <div className='flex w-full min-w-32 items-center gap-3'>
      <ProgressBar value={value} className='flex-1 h-1.5' />
      <span className='w-9 text-right font-mono text-xs text-muted-foreground'>
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
      className='font-semibold text-foreground transition-colors hover:text-primary'
      href={`/projects/${id}`}
    >
      {children}
    </Link>
  )
}
