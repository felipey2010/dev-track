import 'server-only'

import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { paginated } from '@/lib/pagination'
import { prisma } from '@/lib/prisma'
import { ApplicationError } from '@/server/errors/application-error'
import { randomUUID } from 'node:crypto'
import { USER_STATUS } from '../auth/constants'

export async function listUsersExcept(
  currentUserId: string,
  page: number,
  pageSize: number,
  skip: number
) {
  const where = { id: { not: currentUserId } }
  const [items, totalItems] = await prisma.$transaction([
    prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        system_role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.users.count({ where }),
  ])
  return paginated(items, totalItems, page, pageSize)
}

export async function updateUserStatus(input: {
  targetId: string
  status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
  actor: { id: string; name: string; system_role: 'ADMIN' | 'USER' }
}) {
  if (input.actor.id === input.targetId && input.status !== USER_STATUS.ACTIVE)
    throw new ApplicationError(
      'Você não pode suspender ou rejeitar a própria conta.',
      422
    )
  const target = await prisma.users.findUnique({
    where: { id: input.targetId },
    select: { id: true, status: true },
  })
  if (!target) throw new ApplicationError('Usuário não encontrado.', 404)

  await prisma.$transaction([
    prisma.users.update({
      where: { id: input.targetId },
      data: { status: input.status },
    }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: 'USER',
        entity_id: input.targetId,
        action: AUDIT_ACTIONS.userStatusChanged[input.status],
        actor_user_id: input.actor.id,
        actor_name_snapshot: input.actor.name,
        actor_system_role_snapshot: input.actor.system_role,
        metadata_json: {
          previousStatus: target.status,
          newStatus: input.status,
        },
      },
    }),
  ])
  return { id: input.targetId, status: input.status }
}

export async function getUserProfile(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
      system_role: true,
      created_at: true,
      teams: {
        select: {
          id: true,
          name: true,
          description: true,
          projects: {
            select: { id: true, name: true, status: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
      team_members: {
        select: {
          role: true,
          teams: {
            select: {
              id: true,
              name: true,
              description: true,
              projects: {
                select: { id: true, name: true, status: true },
                orderBy: { name: 'asc' },
              },
            },
          },
        },
        orderBy: { teams: { name: 'asc' } },
      },
    },
  })
  if (!user) return null

  const teams = [
    ...user.teams.map((team) => ({ ...team, role: 'LEADER' as const })),
    ...user.team_members.map(({ role, teams: team }) => ({ ...team, role })),
  ]
  const projects = Array.from(
    new Map(
      teams
        .flatMap((team) => team.projects)
        .map((project) => [project.id, project])
    ).values()
  ).sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    status: user.status,
    systemRole: user.system_role,
    createdAt: user.created_at,
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      role: team.role,
    })),
    projects,
  }
}
