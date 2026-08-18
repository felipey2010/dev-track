'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiRequest } from '@/lib/client-api/http'
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationsData,
  type NotificationItem,
} from '@/lib/client-api/notifications'
import { dateTimeLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

const notificationsKey = ['notifications']

export function NotificationBell() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: notificationsKey,
    queryFn: () =>
      apiRequest<NotificationsData>('/api/notifications?page=1&pageSize=10'),
    refetchInterval: 30_000,
  })
  const readOne = useMutation({
    mutationFn: (notification: NotificationItem) =>
      markNotificationRead(notification.id).then(() => notification),
    onSuccess: async (notification) => {
      await queryClient.invalidateQueries({ queryKey: notificationsKey })
      if (notification.action_url) router.push(notification.action_url)
    },
  })
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKey }),
  })
  const unreadCount = query.data?.unreadCount ?? 0

  return (
    <DropdownMenu onOpenChange={(open) => open && query.refetch()}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'relative text-muted-foreground'
        )}
        aria-label={
          unreadCount
            ? `Notificações: ${unreadCount} não lidas`
            : 'Notificações'
        }
      >
        <Bell className='size-4' />
        {unreadCount > 0 && (
          <span className='absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-semibold leading-4 text-white'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-[min(24rem,calc(100vw-2rem))] p-0'
      >
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <div>
            <p className='text-sm font-semibold'>Notificações</p>
            <p className='text-xs text-muted-foreground'>
              {unreadCount ? `${unreadCount} não lida(s)` : 'Tudo em dia'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              size='xs'
              variant='ghost'
              disabled={readAll.isPending}
              onClick={() => readAll.mutate()}
            >
              <CheckCheck /> Marcar todas
            </Button>
          )}
        </div>
        <div className='max-h-96 overflow-y-auto p-1'>
          {query.isLoading ? (
            <p className='p-2 text-center text-xs text-muted-foreground'>
              Carregando...
            </p>
          ) : query.error ? (
            <p className='p-2 text-center text-xs text-destructive'>
              {query.error.message}
            </p>
          ) : !query.data?.items.length ? (
            <p className='p-2 text-center text-xs text-muted-foreground'>
              Nenhuma notificação
            </p>
          ) : (
            query.data.items.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className='items-start gap-3 px-3 py-3'
                onClick={() => readOne.mutate(notification)}
              >
                <span
                  className={cn(
                    'mt-1.5 size-2 rounded-full',
                    notification.read_at ? 'bg-transparent' : 'bg-amber-500'
                  )}
                />
                <span className='min-w-0 flex-1'>
                  <span className='block text-sm font-medium'>
                    {notification.title}
                  </span>
                  <span className='mt-0.5 block text-xs leading-relaxed text-muted-foreground'>
                    {notification.message}
                  </span>
                  <span className='mt-1 block font-mono text-[9px] text-muted-foreground'>
                    {dateTimeLabel(notification.created_at)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
