import 'server-only'
import { paginated } from '@/lib/pagination'
import { prisma } from '@/lib/prisma'
import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import type { TeamFormData } from '@/lib/teams/validation'
import { ApplicationError } from '@/server/errors/application-error'
import { randomUUID } from 'node:crypto'
import { createNotifications, type NotificationInput } from './notifications'

type Actor = {
  id: string
  name: string
  system_role: 'ADMIN' | 'USER'
}
export async function listTeams(
  actor: Actor,
  pagination: { page: number; pageSize: number; skip: number; enabled: boolean }
) {
  const where =
    actor.system_role === 'ADMIN'
      ? undefined
      : {
          OR: [
            { leader_id: actor.id },
            { team_members: { some: { user_id: actor.id } } },
          ],
        }
  const rows = await prisma.teams.findMany({
    where,
    include: {
      users: { select: { id: true, name: true, status: true } },
      team_members: { select: { role: true } },
      _count: { select: { projects: true } },
    },
    orderBy: { name: 'asc' },
    skip: pagination.enabled ? pagination.skip : undefined,
    take: pagination.enabled ? pagination.pageSize : undefined,
  })
  const items = rows.map(({ team_members, ...team }) => ({
    ...team,
    canManage: team.leader_id === actor.id,
    developerCount: team_members.filter((member) => member.role === 'DEVELOPER')
      .length,
    testerCount: team_members.filter((member) => member.role === 'TESTER')
      .length,
  }))
  return pagination.enabled
    ? paginated(
        items,
        await prisma.teams.count({ where }),
        pagination.page,
        pagination.pageSize
      )
    : items
}

export async function listTeamUserOptions() {
  return prisma.users.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, email: true },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
  })
}

const teamInclude = {
  users: { select: { id: true, name: true, email: true, status: true } },
  team_members: {
    select: {
      id: true,
      role: true,
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
        },
      },
    },
    orderBy: { created_at: 'asc' as const },
  },
  projects: {
    select: {
      id: true,
      name: true,
      description: true,
      client: true,
      status: true,
      start_date: true,
      expected_completion_date: true,
      updated_at: true,
    },
    orderBy: { name: 'asc' as const },
  },
  _count: { select: { projects: true } },
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}

async function validatePeople(input: TeamFormData) {
  const ids = [
    input.leaderId,
    ...input.members.map((member) => member.userId),
  ].filter(Boolean) as string[]
  if (!ids.length) return
  const activeCount = await prisma.users.count({
    where: { id: { in: ids }, status: 'ACTIVE' },
  })
  if (activeCount !== ids.length)
    throw new ApplicationError(
      'A liderança e os membros da equipe devem ser usuários ativos.',
      422
    )
}

export async function getTeam(id: string, actor: Actor) {
  const team = await prisma.teams.findUnique({
    where: { id },
    include: teamInclude,
  })
  if (!team) throw new ApplicationError('Equipe não encontrada.', 404)
  const canView =
    actor.system_role === 'ADMIN' ||
    team.leader_id === actor.id ||
    team.team_members.some((member) => member.users.id === actor.id)
  if (!canView) throw new ApplicationError('Equipe não encontrada.', 404)
  return team
}

export async function createTeam(input: TeamFormData, actor: Actor) {
  await validatePeople(input)
  const id = randomUUID()
  const eventId = randomUUID()
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.teams.create({
        data: {
          id,
          name: input.name,
          description: input.description || null,
          leader_id: input.leaderId || null,
          team_members: {
            create: input.members.map((member) => ({
              id: randomUUID(),
              user_id: member.userId,
              role: member.role,
            })),
          },
        },
      })
      await transaction.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'TEAM',
          entity_id: id,
          action: AUDIT_ACTIONS.teamCreated,
          actor_user_id: actor.id,
          actor_name_snapshot: actor.name,
          actor_system_role_snapshot: actor.system_role,
          metadata_json: {
            name: input.name,
            leaderId: input.leaderId || null,
            memberCount: input.members.length,
          },
        },
      })
      await createNotifications(
        transaction,
        actor,
        teamCreatedNotifications(id, input, eventId)
      )
    })
  } catch (error) {
    if (isUniqueViolation(error))
      throw new ApplicationError('Já existe uma equipe com este nome.', 409)
    throw error
  }
  return { id }
}

export async function updateTeam(
  id: string,
  input: TeamFormData,
  actor: Actor
) {
  await validatePeople(input)
  const current = await prisma.teams.findUnique({
    where: { id },
    include: {
      team_members: { select: { user_id: true, role: true } },
      _count: { select: { projects: true } },
    },
  })
  if (!current) throw new ApplicationError('Equipe não encontrada.', 404)
  if (current._count.projects && !input.leaderId)
    throw new ApplicationError(
      'Uma equipe vinculada a projetos precisa ter uma liderança ativa.',
      422
    )
  const eventId = randomUUID()
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.team_members.deleteMany({ where: { team_id: id } })
      await transaction.teams.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description || null,
          leader_id: input.leaderId || null,
          updated_at: new Date(),
          team_members: {
            create: input.members.map((member) => ({
              id: randomUUID(),
              user_id: member.userId,
              role: member.role,
            })),
          },
        },
      })
      await transaction.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'TEAM',
          entity_id: id,
          action: AUDIT_ACTIONS.teamUpdated,
          actor_user_id: actor.id,
          actor_name_snapshot: actor.name,
          actor_system_role_snapshot: actor.system_role,
          metadata_json: {
            previous: {
              name: current.name,
              leaderId: current.leader_id,
              members: current.team_members,
            },
            current: {
              name: input.name,
              leaderId: input.leaderId || null,
              members: input.members,
            },
          },
        },
      })
      await createNotifications(
        transaction,
        actor,
        teamUpdatedNotifications(id, current, input, eventId)
      )
    })
  } catch (error) {
    if (isUniqueViolation(error))
      throw new ApplicationError('Já existe uma equipe com este nome.', 409)
    throw error
  }
  return { id }
}

const memberRoleLabels = {
  DEVELOPER: 'desenvolvedor',
  TESTER: 'testador',
} as const

function teamCreatedNotifications(
  teamId: string,
  input: TeamFormData,
  eventId: string
): NotificationInput[] {
  const notifications: NotificationInput[] = input.members.map((member) => ({
    recipientUserId: member.userId,
    eventKey: 'TEAM_MEMBERSHIP_ADDED',
    title: 'Você entrou em uma equipe',
    message: `Você foi adicionado como ${memberRoleLabels[member.role]} na equipe ${input.name}.`,
    entityType: 'TEAM',
    entityId: teamId,
    actionUrl: `/teams/${teamId}`,
    metadata: { role: member.role },
    deduplicationKey: `${eventId}:${member.userId}:member-added`,
  }))
  if (input.leaderId)
    notifications.push({
      recipientUserId: input.leaderId,
      eventKey: 'TEAM_LEADER_ASSIGNED',
      title: 'Você lidera uma nova equipe',
      message: `Você foi definido como liderança da equipe ${input.name}.`,
      entityType: 'TEAM',
      entityId: teamId,
      actionUrl: `/teams/${teamId}`,
      deduplicationKey: `${eventId}:${input.leaderId}:leader-assigned`,
    })
  return notifications
}

function teamUpdatedNotifications(
  teamId: string,
  current: {
    name: string
    leader_id: string | null
    team_members: { user_id: string; role: 'DEVELOPER' | 'TESTER' }[]
  },
  input: TeamFormData,
  eventId: string
): NotificationInput[] {
  const notifications: NotificationInput[] = []
  if (current.leader_id && current.leader_id !== input.leaderId)
    notifications.push({
      recipientUserId: current.leader_id,
      eventKey: 'TEAM_LEADER_REMOVED',
      title: 'Liderança de equipe alterada',
      message: `Você não é mais a liderança da equipe ${current.name}.`,
      entityType: 'TEAM',
      entityId: teamId,
      deduplicationKey: `${eventId}:${current.leader_id}:leader-removed`,
    })
  if (input.leaderId && input.leaderId !== current.leader_id)
    notifications.push({
      recipientUserId: input.leaderId,
      eventKey: 'TEAM_LEADER_ASSIGNED',
      title: 'Nova liderança de equipe',
      message: `Você agora lidera a equipe ${input.name}.`,
      entityType: 'TEAM',
      entityId: teamId,
      actionUrl: `/teams/${teamId}`,
      deduplicationKey: `${eventId}:${input.leaderId}:leader-assigned`,
    })

  const previousMembers = new Map(
    current.team_members.map((member) => [member.user_id, member.role])
  )
  const nextMembers = new Map(
    input.members.map((member) => [member.userId, member.role])
  )
  for (const member of input.members) {
    const previousRole = previousMembers.get(member.userId)
    if (!previousRole || previousRole !== member.role)
      notifications.push({
        recipientUserId: member.userId,
        eventKey: previousRole
          ? 'TEAM_MEMBER_ROLE_CHANGED'
          : 'TEAM_MEMBERSHIP_ADDED',
        title: previousRole ? 'Sua função mudou' : 'Você entrou em uma equipe',
        message: `Sua função na equipe ${input.name} agora é ${memberRoleLabels[member.role]}.`,
        entityType: 'TEAM',
        entityId: teamId,
        actionUrl: `/teams/${teamId}`,
        metadata: { previousRole: previousRole ?? null, role: member.role },
        deduplicationKey: `${eventId}:${member.userId}:member-role`,
      })
  }
  for (const member of current.team_members)
    if (!nextMembers.has(member.user_id))
      notifications.push({
        recipientUserId: member.user_id,
        eventKey: 'TEAM_MEMBERSHIP_REMOVED',
        title: 'Você saiu de uma equipe',
        message: `Seu vínculo com a equipe ${current.name} foi removido.`,
        entityType: 'TEAM',
        entityId: teamId,
        metadata: { previousRole: member.role },
        deduplicationKey: `${eventId}:${member.user_id}:member-removed`,
      })
  return notifications
}

export async function deleteTeam(id: string, actor: Actor) {
  const team = await prisma.teams.findUnique({
    where: { id },
    select: { name: true, _count: { select: { projects: true } } },
  })
  if (!team) throw new ApplicationError('Equipe não encontrada.', 404)
  if (team._count.projects)
    throw new ApplicationError(
      'Não é possível excluir uma equipe vinculada a projetos.',
      409
    )
  await prisma.$transaction([
    prisma.team_members.deleteMany({ where: { team_id: id } }),
    prisma.teams.delete({ where: { id } }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: 'TEAM',
        entity_id: id,
        action: AUDIT_ACTIONS.teamDeleted,
        actor_user_id: actor.id,
        actor_name_snapshot: actor.name,
        actor_system_role_snapshot: actor.system_role,
        metadata_json: { name: team.name },
      },
    }),
  ])
  return { id }
}
