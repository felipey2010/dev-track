import 'server-only'

import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { paginated } from '@/lib/pagination'
import { prisma } from '@/lib/prisma'
import type { ProjectFormData } from '@/lib/projects/validation'
import {
  ApplicationError,
  AuthorizationError,
} from '@/server/errors/application-error'
import { randomUUID } from 'node:crypto'
import { USER_STATUS } from '../auth/constants'

type Actor = { id: string; name: string; system_role: 'ADMIN' | 'USER' }
type Pagination = {
  page: number
  pageSize: number
  skip: number
  enabled: boolean
}

export async function listProjects(actor: Actor, pagination: Pagination) {
  const where =
    actor.system_role === 'ADMIN'
      ? undefined
      : {
          OR: [
            { teams: { leader_id: actor.id } },
            { teams: { team_members: { some: { user_id: actor.id } } } },
          ],
        }
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
        metadata_json: { teamId: team.id, status: input.status },
      },
    }),
  ])
  return { id }
}

export async function getProject(id: string) {
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
    team: { id: row.teams.id, name: row.teams.name, leader: row.teams.users },
    progress: row.requirements.length
      ? Math.round((completed / row.requirements.length) * 100)
      : 0,
  }
}
