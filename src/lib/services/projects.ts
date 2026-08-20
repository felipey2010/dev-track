import 'server-only'

import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { paginated } from '@/lib/pagination'
import { prisma } from '@/lib/prisma'
import type { ProjectFormData } from '@/lib/projects/validation'
import {
  ApplicationError,
  AuthorizationError,
} from '@/server/errors/application-error'
import { ACCOUNT_ROLE } from '@/types/next-auth'
import { randomUUID } from 'node:crypto'
import { USER_ROLE, USER_STATUS } from '../auth/constants'

type Actor = { id: string; name: string; system_role: ACCOUNT_ROLE }
type Pagination = {
  page: number
  pageSize: number
  skip: number
  enabled: boolean
  search: string
}

export async function listProjects(actor: Actor, pagination: Pagination) {
  const accessWhere =
    actor.system_role === USER_ROLE.ADMIN
      ? undefined
      : {
          OR: [
            { teams: { leader_id: actor.id } },
            { teams: { team_members: { some: { user_id: actor.id } } } },
          ],
        }
  const searchWhere = pagination.search
    ? {
        OR: [
          {
            name: { contains: pagination.search, mode: 'insensitive' as const },
          },
          {
            client: {
              contains: pagination.search,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: pagination.search,
              mode: 'insensitive' as const,
            },
          },
          {
            teams: {
              name: {
                contains: pagination.search,
                mode: 'insensitive' as const,
              },
            },
          },
        ],
      }
    : undefined
  const where =
    accessWhere && searchWhere
      ? { AND: [accessWhere, searchWhere] }
      : (accessWhere ?? searchWhere)
  const rows = await prisma.projects.findMany({
    where,
    include: {
      teams: { include: { users: { select: { id: true, name: true } } } },
      requirements: { select: { status: true } },
    },
    orderBy: { updated_at: 'desc' },
    skip: pagination.enabled ? pagination.skip : undefined,
    take: pagination.enabled ? pagination.pageSize : undefined,
  })
  const items = rows.map(({ requirements, teams, ...project }) => {
    const completed = requirements.filter(
      (requirement) => requirement.status === 'COMPLETED'
    ).length
    return {
      ...project,
      team: { id: teams.id, name: teams.name, leader: teams.users },
      requirementCount: requirements.length,
      completedRequirementCount: completed,
      progress: requirements.length
        ? Math.round((completed / requirements.length) * 100)
        : 0,
    }
  })
  return pagination.enabled
    ? paginated(
        items,
        await prisma.projects.count({ where }),
        pagination.page,
        pagination.pageSize
      )
    : items
}

export async function createProject(input: ProjectFormData, actor: Actor) {
  const team = await prisma.teams.findUnique({
    where: { id: input.teamId },
    include: { users: { select: { status: true } } },
  })
  if (!team?.users || team.users.status !== USER_STATUS.ACTIVE)
    throw new ApplicationError('A equipe precisa ter uma liderança ativa.', 422)
  if (team.leader_id !== actor.id)
    throw new AuthorizationError(
      'Somente a liderança da equipe pode criar este projeto.'
    )
  const id = randomUUID()

  await prisma.$transaction([
    prisma.projects.create({
      data: {
        id,
        name: input.name,
        description: input.description,
        client: input.client || null,
        team_id: team.id,
        start_date: new Date(`${input.startDate}T00:00:00.000Z`),
        expected_completion_date: input.expectedCompletionDate
          ? new Date(`${input.expectedCompletionDate}T00:00:00.000Z`)
          : null,
        tech_stack: input.techStack,
        status: input.status,
        created_by_id: actor.id,
      },
    }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: 'PROJECT',
        entity_id: id,
        action: AUDIT_ACTIONS.projectCreated,
        actor_user_id: actor.id,
        actor_name_snapshot: actor.name,
        actor_system_role_snapshot: actor.system_role,
        metadata_json: {
          teamId: team.id,
          status: input.status,
          techStack: input.techStack,
        },
      },
    }),
  ])
  return { id }
}

export async function getProject(id: string, actor: Actor) {
  const row = await prisma.projects.findUnique({
    where: { id },
    include: {
      teams: { include: { users: { select: { id: true, name: true } } } },
      requirements: {
        include: {
          users_requirements_assigned_user_idTousers: {
            select: { id: true, name: true },
          },
        },
        orderBy: { created_at: 'asc' },
      },
    },
  })
  if (!row) throw new ApplicationError('Projeto não encontrado.', 404)
  const completed = row.requirements.filter(
    (requirement) => requirement.status === 'COMPLETED'
  ).length
  return {
    ...row,
    canManage:
      actor.system_role === 'ADMIN' || row.teams.leader_id === actor.id,
    canEditProject: row.teams.leader_id === actor.id,
    team: { id: row.teams.id, name: row.teams.name, leader: row.teams.users },
    progress: row.requirements.length
      ? Math.round((completed / row.requirements.length) * 100)
      : 0,
  }
}

async function eligibleTeam(teamId: string, actorId: string) {
  const team = await prisma.teams.findUnique({
    where: { id: teamId },
    include: { users: { select: { status: true } } },
  })
  if (!team?.users || team.users.status !== USER_STATUS.ACTIVE)
    throw new ApplicationError('A equipe precisa ter uma liderança ativa.', 422)
  if (team.leader_id !== actorId)
    throw new AuthorizationError(
      'Você somente pode atribuir projetos a equipes que lidera.'
    )
  return team
}

export async function updateProject(
  id: string,
  input: ProjectFormData,
  actor: Actor
) {
  const current = await prisma.projects.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      client: true,
      team_id: true,
      start_date: true,
      expected_completion_date: true,
      tech_stack: true,
      status: true,
      teams: { select: { leader_id: true } },
    },
  })
  if (!current) throw new ApplicationError('Projeto não encontrado.', 404)
  if (current.teams.leader_id !== actor.id) throw new AuthorizationError()
  await eligibleTeam(input.teamId, actor.id)

  await prisma.$transaction([
    prisma.projects.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        client: input.client || null,
        team_id: input.teamId,
        start_date: new Date(`${input.startDate}T00:00:00.000Z`),
        expected_completion_date: input.expectedCompletionDate
          ? new Date(`${input.expectedCompletionDate}T00:00:00.000Z`)
          : null,
        tech_stack: input.techStack,
        status: input.status,
        updated_at: new Date(),
      },
    }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: 'PROJECT',
        entity_id: id,
        action: AUDIT_ACTIONS.projectUpdated,
        actor_user_id: actor.id,
        actor_name_snapshot: actor.name,
        actor_system_role_snapshot: actor.system_role,
        metadata_json: { previous: current, current: input },
      },
    }),
  ])
  return { id }
}

export async function deleteProject(id: string, actor: Actor) {
  const project = await prisma.projects.findUnique({
    where: { id },
    select: {
      name: true,
      teams: { select: { leader_id: true } },
      _count: { select: { requirements: true } },
    },
  })
  if (!project) throw new ApplicationError('Projeto não encontrado.', 404)
  if (project.teams.leader_id !== actor.id) throw new AuthorizationError()
  if (project._count.requirements)
    throw new ApplicationError(
      'Não é possível excluir um projeto que possui requisitos.',
      409
    )
  await prisma.$transaction([
    prisma.projects.delete({ where: { id } }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: 'PROJECT',
        entity_id: id,
        action: AUDIT_ACTIONS.projectDeleted,
        actor_user_id: actor.id,
        actor_name_snapshot: actor.name,
        actor_system_role_snapshot: actor.system_role,
        metadata_json: { name: project.name },
      },
    }),
  ])
  return { id }
}
