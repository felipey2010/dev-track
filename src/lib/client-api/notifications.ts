import type { PaginatedData } from '@/lib/pagination'
import { apiRequest, jsonRequest } from './http'

export type NotificationItem = {
  id: string
  event_key: string
  title: string
  message: string
  action_url: string | null
  read_at: string | null
  created_at: string
  actor_name_snapshot: string | null
}

export type NotificationsData = PaginatedData<NotificationItem> & {
  unreadCount: number
}

export function markNotificationRead(id: string) {
  return apiRequest<{ id: string }>(
    `/api/notifications/${id}`,
    jsonRequest('PATCH', {})
  )
}

export function markAllNotificationsRead() {
  return apiRequest<{ count: number }>(
    '/api/notifications/read-all',
    jsonRequest('PATCH', {})
  )
}
