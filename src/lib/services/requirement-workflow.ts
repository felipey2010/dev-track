import 'server-only'

import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { prisma } from '@/lib/prisma'
import type { RequirementWorkflowAction } from '@/lib/requirements/workflow'
import { createNotifications } from '@/lib/services/notifications'
import {
  ApplicationError,
  AuthorizationError,
} from '@/server/errors/application-error'
import { randomUUID } from 'node:crypto'

type Actor = { id: string; name: string; system_role: 'ADMIN' | 'USER' }
type TeamRole = 'DEVELOPER' | 'TESTER' | null
type Stage = 'REQUIREMENTS' | 'DEVELOPMENT' | 'TESTING' | 'COMPLETED'

type WorkflowContext = {
  id: string
  status: Stage
  assigned_user_id: string | null
  users_requirements_assigned_user_idTousers: { name: string } | null
  projects: {
    team_id: string
    teams: {
      leader_id: string | null
      team_members: { role: 'DEVELOPER' | 'TESTER' }[]
    }
  }
}

function roleOf(requirement: WorkflowContext): TeamRole {
  return requirement.projects.teams.team_members[0]?.role ?? null
}

function isLeader(requirement: WorkflowContext, actorId: string) {
  return requirement.projects.teams.leader_id === actorId
}

function actionsFor(requirement: WorkflowContext, actorId: string) {
  const role = roleOf(requirement)
  const leader = isLeader(requirement, actorId)
  const assignedToActor = requirement.assigned_user_id === actorId
  const unassigned = requirement.assigned_user_id === null
  const actions: RequirementWorkflowAction[] = []

  if (
    requirement.status === 'REQUIREMENTS' &&
    unassigned &&
    (leader || role === 'DEVELOPER')
  )
    actions.push('START_DEVELOPMENT')
  if (requirement.status === 'DEVELOPMENT') {
    if (unassigned && (leader || role === 'DEVELOPER'))
      actions.push('CLAIM_DEVELOPMENT')
    if (leader || (role === 'DEVELOPER' && assignedToActor))
      actions.push('READY_FOR_TESTING')
  }
  if (requirement.status === 'TESTING') {
    if (unassigned && (leader || role === 'TESTER'))
      actions.push('CLAIM_TESTING')
    if (leader || (role === 'TESTER' && assignedToActor))
      actions.push('COMPLETE', 'RETURN_TO_DEVELOPMENT')
  }
  return actions
}

async function workflowContext(
  projectId: string,
  requirementId: string,
  actorId: string
) {
  return prisma.requirements.findFirst({
    where: { id: requirementId, project_id: projectId },
    select: {
      id: true,
      status: true,
      assigned_user_id: true,
      users_requirements_assigned_user_idTousers: { select: { name: true } },
      projects: {
        select: {
          team_id: true,
          teams: {
            select: {
              leader_id: true,
              team_members: {
                where: { user_id: actorId },
                select: { role: true },
              },
            },
          },
        },
      },
    },
  })
}

export async function getAvailableRequirementActions(
  projectId: string,
  requirementId: string,
  actor: Actor
) {
  const requirement = await workflowContext(projectId, requirementId, actor.id)
  if (!requirement) throw new ApplicationError('Requisito não encontrado.', 404)
  return actionsFor(requirement, actor.id)
}

export async function executeRequirementWorkflow(
  projectId: string,
  requirementId: string,
  action: RequirementWorkflowAction,
  actor: Actor
) {
  const notificationEventId = randomUUID()
  return prisma.$transaction(
    async (transaction) => {
      const requirement = await transaction.requirements.findFirst({
        where: { id: requirementId, project_id: projectId },
        select: {
          id: true,
          status: true,
          assigned_user_id: true,
          users_requirements_assigned_user_idTousers: {
            select: { name: true },
          },
          projects: {
            select: {
              team_id: true,
              teams: {
                select: {
                  leader_id: true,
                  team_members: {
                    where: { user_id: actor.id },
                    select: { role: true },
                  },
                },
              },
            },
          },
        },
      })
      if (!requirement)
        throw new ApplicationError('Requisito não encontrado.', 404)
      if (!actionsFor(requirement, actor.id).includes(action))
        throw new AuthorizationError(
          'Seu papel, a etapa atual ou a atribuição não permitem esta ação.'
        )

      const role = roleOf(requirement)
      const leader = isLeader(requirement, actor.id)
      const context = leader ? 'TEAM_LEADER' : role
      const previousAssigneeId = requirement.assigned_user_id
      const previousAssigneeName =
        requirement.users_requirements_assigned_user_idTousers?.name ?? null

      if (action === 'START_DEVELOPMENT') {
        await assign(transaction, requirementId, actor, {
          action: 'ASSIGNED',
          previousId: null,
          previousName: null,
          status: 'DEVELOPMENT',
          context,
          reason: 'Início do desenvolvimento.',
        })
        await transaction.requirements.update({
          where: { id: requirementId },
          data: {
            status: 'DEVELOPMENT',
            assigned_user_id: actor.id,
            updated_at: new Date(),
          },
        })
        await transaction.development_records.create({
          data: {
            id: randomUUID(),
            requirement_id: requirementId,
            developer_id: actor.id,
          },
        })
        await statusHistory(
          transaction,
          requirementId,
          actor,
          role,
          'REQUIREMENTS',
          'DEVELOPMENT'
        )
      }

      if (action === 'CLAIM_DEVELOPMENT') {
        await assign(transaction, requirementId, actor, {
          action: 'ASSIGNED',
          previousId: null,
          previousName: null,
          status: 'DEVELOPMENT',
          context,
          reason: 'Desenvolvimento retomado.',
        })
        await transaction.requirements.update({
          where: { id: requirementId },
          data: { assigned_user_id: actor.id, updated_at: new Date() },
        })
        await transaction.development_records.create({
          data: {
            id: randomUUID(),
            requirement_id: requirementId,
            developer_id: actor.id,
          },
        })
      }

      if (action === 'READY_FOR_TESTING') {
        if (previousAssigneeId) {
          await unassign(transaction, requirementId, actor, {
            previousId: previousAssigneeId,
            previousName: previousAssigneeName,
            status: 'TESTING',
            context,
            action: 'UNASSIGNED',
            reason: 'Desenvolvimento concluído e enviado para testes.',
          })
          await transaction.development_records.updateMany({
            where: {
              requirement_id: requirementId,
              developer_id: previousAssigneeId,
              completed_at: null,
            },
            data: { completed_at: new Date(), updated_at: new Date() },
          })
        }
        await transaction.requirements.update({
          where: { id: requirementId },
          data: {
            status: 'TESTING',
            assigned_user_id: null,
            updated_at: new Date(),
          },
        })
        await statusHistory(
          transaction,
          requirementId,
          actor,
          role,
          'DEVELOPMENT',
          'TESTING'
        )
      }

      if (action === 'CLAIM_TESTING') {
        await assign(transaction, requirementId, actor, {
          action: 'ASSIGNED',
          previousId: null,
          previousName: null,
          status: 'TESTING',
          context,
          reason: 'Testes iniciados.',
        })
        await transaction.requirements.update({
          where: { id: requirementId },
          data: { assigned_user_id: actor.id, updated_at: new Date() },
        })
        await transaction.testing_records.create({
          data: {
            id: randomUUID(),
            requirement_id: requirementId,
            tester_id: actor.id,
          },
        })
      }

      if (action === 'COMPLETE' || action === 'RETURN_TO_DEVELOPMENT') {
        if (previousAssigneeId !== actor.id) {
          await assign(transaction, requirementId, actor, {
            action: previousAssigneeId ? 'REASSIGNED' : 'ASSIGNED',
            previousId: previousAssigneeId,
            previousName: previousAssigneeName,
            status: 'TESTING',
            context,
            reason: 'A liderança assumiu a validação do requisito.',
          })
          await transaction.testing_records.create({
            data: {
              id: randomUUID(),
              requirement_id: requirementId,
              tester_id: actor.id,
            },
          })
        }
        const target = action === 'COMPLETE' ? 'COMPLETED' : 'DEVELOPMENT'
        const result = action === 'COMPLETE' ? 'APPROVED' : 'FAILED'
        await transaction.testing_records.updateMany({
          where: {
            requirement_id: requirementId,
            tester_id: actor.id,
            completed_at: null,
          },
          data: { completed_at: new Date(), result, updated_at: new Date() },
        })
        await unassign(transaction, requirementId, actor, {
          previousId: actor.id,
          previousName: actor.name,
          status: target,
          context,
          action: action === 'COMPLETE' ? 'UNASSIGNED' : 'INVALIDATED',
          reason:
            action === 'COMPLETE'
              ? 'Testes aprovados.'
              : 'Testes falharam; retorno ao desenvolvimento.',
        })
        await transaction.requirements.update({
          where: { id: requirementId },
          data: {
            status: target,
            assigned_user_id: null,
            updated_at: new Date(),
          },
        })
        await statusHistory(
          transaction,
          requirementId,
          actor,
          role,
          'TESTING',
          target
        )
      }

      await transaction.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'REQUIREMENT',
          entity_id: requirementId,
          action: AUDIT_ACTIONS.requirementWorkflow[action],
          actor_user_id: actor.id,
          actor_name_snapshot: actor.name,
          actor_system_role_snapshot: actor.system_role,
          actor_team_role_snapshot: role,
          metadata_json: { projectId, action },
        },
      })
      const notificationContext = await transaction.requirements.findUnique({
        where: { id: requirementId },
        select: {
          code: true,
          title: true,
          projects: {
            select: {
              name: true,
              teams: {
                select: {
                  leader_id: true,
                  team_members: {
                    where: { users: { status: 'ACTIVE' } },
                    select: { user_id: true, role: true },
                  },
                },
              },
            },
          },
        },
      })
      if (notificationContext) {
        const recipients = new Set<string>()
        const leaderId = notificationContext.projects.teams.leader_id
        if (leaderId) recipients.add(leaderId)
        if (action === 'READY_FOR_TESTING')
          notificationContext.projects.teams.team_members
            .filter((member) => member.role === 'TESTER')
            .forEach((member) => recipients.add(member.user_id))
        if (action === 'RETURN_TO_DEVELOPMENT')
          notificationContext.projects.teams.team_members
            .filter((member) => member.role === 'DEVELOPER')
            .forEach((member) => recipients.add(member.user_id))
        if (action === 'COMPLETE') {
          const developers = await transaction.development_records.findMany({
            where: { requirement_id: requirementId },
            select: { developer_id: true },
            distinct: ['developer_id'],
          })
          developers.forEach((developer) =>
            recipients.add(developer.developer_id)
          )
        }
        const copy = workflowNotificationCopy(
          action,
          notificationContext.code,
          notificationContext.title,
          notificationContext.projects.name
        )
        await createNotifications(
          transaction,
          actor,
          Array.from(recipients).map((recipientUserId) => ({
            recipientUserId,
            eventKey: copy.eventKey,
            title: copy.title,
            message: copy.message,
            entityType: 'REQUIREMENT',
            entityId: requirementId,
            actionUrl: `/projects/${projectId}/requirements/${requirementId}`,
            metadata: { projectId, action },
            deduplicationKey: `${notificationEventId}:${recipientUserId}`,
          }))
        )
      }
      return { id: requirementId, action }
    },
    { isolationLevel: 'Serializable' }
  )
}

function workflowNotificationCopy(
  action: RequirementWorkflowAction,
  code: string,
  title: string,
  projectName: string
) {
  const requirement = `${code} - ${title}`
  const copies: Record<
    RequirementWorkflowAction,
    { eventKey: string; title: string; message: string }
  > = {
    START_DEVELOPMENT: {
      eventKey: 'REQUIREMENT_DEVELOPMENT_STARTED',
      title: 'Desenvolvimento iniciado',
      message: `${requirement} foi iniciado em ${projectName}.`,
    },
    CLAIM_DEVELOPMENT: {
      eventKey: 'REQUIREMENT_DEVELOPMENT_CLAIMED',
      title: 'Desenvolvimento assumido',
      message: `${requirement} foi assumido novamente em ${projectName}.`,
    },
    READY_FOR_TESTING: {
      eventKey: 'REQUIREMENT_READY_FOR_TESTING',
      title: 'Requisito pronto para testes',
      message: `${requirement} está disponível para testes em ${projectName}.`,
    },
    CLAIM_TESTING: {
      eventKey: 'REQUIREMENT_TESTING_CLAIMED',
      title: 'Testes iniciados',
      message: `${requirement} foi assumido para testes em ${projectName}.`,
    },
    COMPLETE: {
      eventKey: 'REQUIREMENT_COMPLETED',
      title: 'Requisito concluído',
      message: `${requirement} foi aprovado e concluído em ${projectName}.`,
    },
    RETURN_TO_DEVELOPMENT: {
      eventKey: 'REQUIREMENT_RETURNED_TO_DEVELOPMENT',
      title: 'Requisito devolvido ao desenvolvimento',
      message: `${requirement} falhou nos testes e precisa de ajustes em ${projectName}.`,
    },
  }
  return copies[action]
}

type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

async function assign(
  transaction: Transaction,
  requirementId: string,
  actor: Actor,
  input: {
    action: 'ASSIGNED' | 'REASSIGNED'
    previousId: string | null
    previousName: string | null
    status: Stage
    context: string | null
    reason: string
  }
) {
  await transaction.requirement_assignment_history.create({
    data: {
      id: randomUUID(),
      requirement_id: requirementId,
      action: input.action,
      previous_assignee_id: input.previousId,
      new_assignee_id: actor.id,
      performed_by_id: actor.id,
      requirement_status: input.status,
      reason: input.reason,
      performed_by_name_snapshot: actor.name,
      performed_by_context_snapshot: input.context,
      previous_assignee_name_snapshot: input.previousName,
      new_assignee_name_snapshot: actor.name,
    },
  })
}

async function unassign(
  transaction: Transaction,
  requirementId: string,
  actor: Actor,
  input: {
    previousId: string
    previousName: string | null
    status: Stage
    context: string | null
    action: 'UNASSIGNED' | 'INVALIDATED'
    reason: string
  }
) {
  await transaction.requirement_assignment_history.create({
    data: {
      id: randomUUID(),
      requirement_id: requirementId,
      action: input.action,
      previous_assignee_id: input.previousId,
      new_assignee_id: null,
      performed_by_id: actor.id,
      requirement_status: input.status,
      reason: input.reason,
      performed_by_name_snapshot: actor.name,
      performed_by_context_snapshot: input.context,
      previous_assignee_name_snapshot: input.previousName,
      new_assignee_name_snapshot: null,
    },
  })
}

async function statusHistory(
  transaction: Transaction,
  requirementId: string,
  actor: Actor,
  role: TeamRole,
  from: Stage,
  to: Stage
) {
  await transaction.requirement_history.create({
    data: {
      id: randomUUID(),
      requirement_id: requirementId,
      from_status: from,
      to_status: to,
      performed_by_id: actor.id,
      actor_name_snapshot: actor.name,
      actor_system_role_snapshot: actor.system_role,
      actor_team_role_snapshot: role,
    },
  })
}
