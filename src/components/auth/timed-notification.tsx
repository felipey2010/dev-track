'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const NOTIFICATION_DURATION_MS = 6_000

export function TimedNotification({
  children,
  variant = 'error',
  onDismiss,
  className,
}: {
  children: React.ReactNode
  variant?: 'error' | 'success' | 'neutral'
  onDismiss?: () => void
  className?: string
}) {
  const [visible, setVisible] = useState(true)
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false)
      onDismissRef.current?.()
    }, NOTIFICATION_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [children])

  if (!visible) return null

  return (
    <p
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'text-xs',
        variant === 'error' && 'text-destructive',
        variant === 'success' && 'text-emerald-600 dark:text-emerald-400',
        variant === 'neutral' && 'text-muted-foreground',
        className
      )}
    >
      {children}
    </p>
  )
}
