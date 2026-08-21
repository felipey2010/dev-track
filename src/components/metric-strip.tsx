import { cn } from '@/lib/utils'

export function MetricStrip({ children }: { children: React.ReactNode }) {
  return (
    <section className='mb-7 grid overflow-hidden rounded-xl border border-border/70 bg-card sm:grid-cols-2 lg:grid-cols-4'>
      {children}
    </section>
  )
}

export function Metric({
  label,
  value,
  note,
  tone = 'default',
  truncateNote = false,
}: {
  label: string
  value: React.ReactNode
  note: React.ReactNode
  tone?: 'default' | 'primary' | 'amber' | 'destructive' | 'success'
  truncateNote?: boolean
}) {
  return (
    <div className='border-b border-border/70 p-5 last:border-0 sm:border-r sm:nth-[2]:border-r-0 lg:border-b-0 lg:nth-[2]:border-r lg:last:border-r-0'>
      <span className='text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground'>
        {label}
      </span>
      <strong
        className={cn('mt-3 block text-[26px] leading-none', {
          'text-primary': tone === 'primary',
          'text-amber-500': tone === 'amber',
          'text-destructive': tone === 'destructive',
          'text-success': tone === 'success',
        })}
      >
        {value}
      </strong>
      <span
        className={cn('mt-2 block text-xs text-muted-foreground', {
          truncate: truncateNote,
        })}
      >
        {note}
      </span>
    </div>
  )
}
