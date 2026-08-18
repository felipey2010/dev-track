import 'server-only'

import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { prisma } from '@/lib/prisma'
import type { RequirementFormData } from '@/lib/requirements/validation'
import { ApplicationError } from '@/server/errors/application-error'
import { randomUUID } from 'node:crypto'
import { ACCOUNT_ROLE } from '@/types/next-auth'

type Actor = { id: string; name: string; system_role: ACCOUNT_ROLE }

function isAllocationConflict(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'P2002' || error.code === 'P2034')
  )
}

function nextRequirementCode(codes: string[]) {
  const used = new Set(
    codes.flatMap((code) => {
      const match = /^REQ-(\d+)$/.exec(code)
      return match ? [Number(match[1])] : []
    })
  )
  let sequence = 1
  while (used.has(sequence)) sequence += 1
  return `REQ-${String(sequence).padStart(3, '0')}`
}

function deadline(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

export async function getRequirement(projectId: string, requirementId: string) {
  const requirement = await prisma.requirements.findFirst({
    where: { id: requirementId, project_id: projectId },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          teams: { select: { id: true, name: true } },
        },
      },
      users_requirements_assigned_user_idTousers: {
        select: { id: true, name: true },
      },
      users_requirements_created_by_idTousers: {
        select: { id: true, name: true },
      },
      requirement_history: {
        select: {
          id: true,
          from_status: true,
          to_status: true,
          note: true,
          actor_name_snapshot: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      },
      requirement_assignment_history: {
        select: {
          id: true,
          action: true,
          previous_assignee_name_snapshot: true,
          new_assignee_name_snapshot: true,
          performed_by_name_snapshot: true,
          reason: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      },
    },
  })
  if (!requirement) throw new ApplicationError('Requisito não encontrado.', 404)
  return requirement
}

export async function createRequirement(
  projectId: string,
  input: RequirementFormData,
  actor: Actor
) {
  const id = randomUUID()
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const code = await prisma.$transaction(
        async (transaction) => {
          const existing = await transaction.requirements.findMany({
            where: { project_id: projectId },
            select: { code: true },
          })
          const allocatedCode = nextRequirementCode(
            existing.map((requirement) => requirement.code)
          )
          await transaction.requirements.create({
            data: {
              id,
              project_id: projectId,
              code: allocatedCode,
              title: input.title,
              description: input.description,
              type: input.type,
              priority: input.priority,
              deadline: deadline(input.deadline),
              created_by_id: actor.id,
            },
          })
          await transaction.audit_logs.create({
            data: {
              id: randomUUID(),
              entity_type: 'REQUIREMENT',
              entity_id: id,
              action: AUDIT_ACTIONS.requirementCreated,
              actor_user_id: actor.id,
              actor_name_snapshot: actor.name,
              actor_system_role_snapshot: actor.system_role,
              metadata_json: { projectId, code: allocatedCode },
            },
          })
          return allocatedCode
        },
        { isolationLevel: 'Serializable' }
      )
      return { id, code }
    } catch (error) {
      if (!isAllocationConflict(error)) throw error
      if (attempt === 2)
        throw new ApplicationError(
          'Não foi possível reservar um código para o requisito.',
          409
        )
    }
  }
  throw new ApplicationError(
    'Não foi possível reservar um código para o requisito.',
    409
  )
}

export async function updateRequirement(
  projectId: string,
  requirementId: string,
  input: RequirementFormData,
  actor: Actor
) {
  const current = await prisma.requirements.findFirst({
    where: { id: requirementId, project_id: projectId },
    select: {
      code: true,
      title: true,
      description: true,
      type: true,
      priority: true,
      deadline: true,
    },
  })
  if (!current) throw new ApplicationError('Requisito não encontrado.', 404)
  await prisma.$transaction([
    prisma.requirements.update({
      where: { id: requirementId },
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        deadline: deadline(input.deadline),
        updated_at: new Date(),
      },
    }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: 'REQUIREMENT',
        entity_id: requirementId,
        action: AUDIT_ACTIONS.requirementUpdated,
        actor_user_id: actor.id,
        actor_name_snapshot: actor.name,
        actor_system_role_snapshot: actor.system_role,
        metadata_json: { projectId, previous: current, current: input },
      },
    }),
  ])
  return { id: requirementId }
}

export async function deleteRequirement(
  projectId: string,
  requirementId: string,
  actor: Actor
) {
  const requirement = await prisma.requirements.findFirst({
    where: { id: requirementId, project_id: projectId },
    select: {
      code: true,
      assigned_user_id: true,
      _count: {
        select: {
          development_records: true,
          testing_records: true,
          requirement_history: true,
          requirement_assignment_history: true,
        },
      },
    },
  })
  if (!requirement) throw new ApplicationError('Requisito não encontrado.', 404)
  const hasHistory =
    requirement.assigned_user_id ||
    Object.values(requirement._count).some((count) => count > 0)
  if (hasHistory)
    throw new ApplicationError(
      'Não é possível excluir um requisito que possui atribuições ou histórico de trabalho.',
      409
    )
  await prisma.$transaction([
    prisma.requirements.delete({ where: { id: requirementId } }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: 'REQUIREMENT',
        entity_id: requirementId,
        action: AUDIT_ACTIONS.requirementDeleted,
        actor_user_id: actor.id,
        actor_name_snapshot: actor.name,
        actor_system_role_snapshot: actor.system_role,
        metadata_json: { projectId, code: requirement.code },
      },
    }),
  ])
  return { id: requirementId }
}
