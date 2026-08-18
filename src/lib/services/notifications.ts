import 'server-only'

import { paginated } from '@/lib/pagination'
import { prisma } from '@/lib/prisma'
import { ApplicationError } from '@/server/errors/application-error'
import { randomUUID } from 'node:crypto'

type Actor = {
  id: string
  name: string
  system_role: 'ADMIN' | 'USER'
}

export type NotificationInput = {
  recipientUserId: string
  eventKey: string
  title: string
  message: string
  entityType?: 'USER' | 'TEAM' | 'TEAM_MEMBER' | 'PROJECT' | 'REQUIREMENT'
  entityId?: string
  actionUrl?: string
  metadata?: Record<string, string | number | boolean | null>
  deduplicationKey: string
}

type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export async function createNotifications(
  transaction: Transaction,
  actor: Actor,
  inputs: NotificationInput[]
) {
  const unique = Array.from(
    new Map(
      inputs
        .filter((input) => input.recipientUserId !== actor.id)
        .map((input) => [input.deduplicationKey, input])
    ).values()
  )
  if (!unique.length) return
  await transaction.notifications.createMany({
    data: unique.map((input) => ({
      id: randomUUID(),
      recipient_user_id: input.recipientUserId,
      actor_user_id: actor.id,
      actor_name_snapshot: actor.name,
      actor_system_role_snapshot: actor.system_role,
      event_key: input.eventKey,
      title: input.title,
      message: input.message,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action_url: input.actionUrl,
      metadata_json: input.metadata,
      deduplication_key: input.deduplicationKey,
    })),
    skipDuplicates: true,
  })
}

export async function listNotifications(
  userId: string,
  page: number,
  pageSize: number,
  skip: number
) {
  const now = new Date()
  const where = {
    recipient_user_id: userId,
    OR: [{ expires_at: null }, { expires_at: { gt: now } }],
  }
  const [items, totalItems, unreadCount] = await prisma.$transaction([
    prisma.notifications.findMany({
      where,
      select: {
        id: true,
        event_key: true,
        title: true,
        message: true,
        action_url: true,
        read_at: true,
        created_at: true,
        actor_name_snapshot: true,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.notifications.count({ where }),
    prisma.notifications.count({ where: { ...where, read_at: null } }),
  ])
  return { ...paginated(items, totalItems, page, pageSize), unreadCount }
}

export async function markNotificationRead(id: string, userId: string) {
  const result = await prisma.notifications.updateMany({
    where: { id, recipient_user_id: userId, read_at: null },
    data: { read_at: new Date() },
  })
  if (!result.count) {
    const exists = await prisma.notifications.count({
      where: { id, recipient_user_id: userId },
    })
    if (!exists) throw new ApplicationError('Notificação não encontrada.', 404)
  }
  return { id }
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notifications.updateMany({
    where: {
      recipient_user_id: userId,
      read_at: null,
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    data: { read_at: new Date() },
  })
  return { count: result.count }
}
