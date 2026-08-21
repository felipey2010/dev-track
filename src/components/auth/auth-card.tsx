import { cn } from '@/lib/utils'

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card p-6 shadow-[0_18px_50px_-24px_rgba(0,0,0,.55)] sm:p-8 [&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-[10px] [&_[data-slot=input]]:bg-background/70',
        className
      )}
    >
      {children}
    </div>
  )
}
