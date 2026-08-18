import GoBack from '@/components/go-back-button'
import { RequirementNotFound } from '@/components/feedback/entity-not-found'
import { RequirementWorkflowActions } from '@/components/requirements/requirement-workflow-actions'
import { PageHeader, StatusBadge } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dateLabel, dateTimeLabel, requirementStatusLabel } from '@/lib/format'
import { getAvailableRequirementActions } from '@/lib/services/requirement-workflow'
import { getRequirement } from '@/lib/services/requirements'
import { identifierSchema } from '@/lib/validation/common'
import { requireProjectAccess } from '@/server/authorization/session'
import { ApplicationError } from '@/server/errors/application-error'
import { CalendarDays, FolderKanban, UserRound } from 'lucide-react'
import Link from 'next/link'

const typeLabels = {
  FUNCTIONAL: 'Funcional',
  NON_FUNCTIONAL: 'Não funcional',
} as const

const priorityLabels = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
} as const

export default async function RequirementDetailsPage({
  params,
}: {
  params: Promise<{ id: string; requirementId: string }>
}) {
  const routeParams = await params
  const projectId = identifierSchema.safeParse(routeParams.id)
  const requirementId = identifierSchema.safeParse(routeParams.requirementId)
  if (!projectId.success || !requirementId.success)
    return <RequirementNotFound projectId={projectId.data} />

  let actor
  let requirement
  try {
    actor = await requireProjectAccess(projectId.data)
    requirement = await getRequirement(projectId.data, requirementId.data)
  } catch (error) {
    if (error instanceof ApplicationError && error.status === 404)
      return <RequirementNotFound projectId={projectId.data} />
    throw error
  }

  const history = [
    ...requirement.requirement_history.map((entry) => ({
      id: entry.id,
      title: `${entry.from_status ? requirementStatusLabel(entry.from_status) : 'Criação'} → ${requirementStatusLabel(entry.to_status)}`,
      actor: entry.actor_name_snapshot,
      note: entry.note,
      createdAt: entry.created_at,
    })),
    ...requirement.requirement_assignment_history.map((entry) => ({
      id: entry.id,
      title: assignmentLabel(entry.action),
      actor: entry.performed_by_name_snapshot,
      note:
        entry.reason ??
        assignmentPeople(
          entry.previous_assignee_name_snapshot,
          entry.new_assignee_name_snapshot
        ),
      createdAt: entry.created_at,
    })),
  ].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime()
  )
  const workflowActions = await getAvailableRequirementActions(
    projectId.data,
    requirementId.data,
    actor
  )

  return (
    <div className='mx-auto max-w-7xl'>
      <GoBack className='mb-5' />
      <p className='mb-3 font-mono text-[10px] text-muted-foreground'>
        Projetos / {requirement.projects.name} / {requirement.code}
      </p>
      <PageHeader
        eyebrow={requirement.code}
        title={requirement.title}
        description={requirement.description}
      />

      <section className='mb-6 grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 lg:grid-cols-4'>
        <Summary icon={<FolderKanban />} label='Projeto / equipe'>
          <Link
            href={`/projects/${requirement.projects.id}`}
            className='font-semibold hover:text-cyan-600'
          >
            {requirement.projects.name}
          </Link>
          <Link
            href={`/teams/${requirement.projects.teams.id}`}
            className='block text-xs text-muted-foreground hover:text-cyan-600'
          >
            {requirement.projects.teams.name}
          </Link>
        </Summary>
        <Summary icon={<UserRound />} label='Responsável atual'>
          {requirement.users_requirements_assigned_user_idTousers ? (
            <Link
              href={`/users/${requirement.users_requirements_assigned_user_idTousers.id}`}
              className='font-semibold hover:text-cyan-600'
            >
              {requirement.users_requirements_assigned_user_idTousers.name}
            </Link>
          ) : (
            <span className='text-muted-foreground'>Disponível</span>
          )}
        </Summary>
        <Summary icon={<CalendarDays />} label='Prazo'>
          <strong>{dateLabel(requirement.deadline)}</strong>
        </Summary>
        <Summary label='Status'>
          <StatusBadge value={requirementStatusLabel(requirement.status)} />
        </Summary>
      </section>

      <RequirementWorkflowActions
        projectId={projectId.data}
        requirementId={requirementId.data}
        actions={workflowActions}
      />

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]'>
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-5 sm:grid-cols-2'>
            <Detail label='Tipo'>{typeLabels[requirement.type]}</Detail>
            <Detail label='Prioridade'>
              <Badge variant='outline'>
                {priorityLabels[requirement.priority]}
              </Badge>
            </Detail>
            <Detail label='Criado por'>
              <Link
                href={`/users/${requirement.users_requirements_created_by_idTousers.id}`}
                className='hover:text-cyan-600'
              >
                {requirement.users_requirements_created_by_idTousers.name}
              </Link>
            </Detail>
            <Detail label='Criado em'>
              {dateTimeLabel(requirement.created_at)}
            </Detail>
            <Detail label='Atualizado em'>
              {dateTimeLabel(requirement.updated_at)}
            </Detail>
          </CardContent>
        </Card>

        <Card className='gap-0 overflow-hidden py-0'>
          <CardHeader className='border-b py-4'>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {!history.length ? (
              <p className='p-6 text-sm text-muted-foreground'>
                Nenhuma alteração de fluxo registrada.
              </p>
            ) : (
              <div className='divide-y'>
                {history.map((entry) => (
                  <div key={entry.id} className='p-4'>
                    <p className='text-sm font-medium'>{entry.title}</p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {entry.actor} · {dateTimeLabel(entry.createdAt)}
                    </p>
                    {entry.note && <p className='mt-2 text-xs'>{entry.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Summary({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-24 items-center gap-3 border-b p-5 last:border-0 sm:border-r lg:border-b-0'>
      {icon && (
        <span className='text-muted-foreground [&>svg]:size-5'>{icon}</span>
      )}
      <div>
        <span className='block text-[9px] uppercase tracking-wider text-muted-foreground'>
          {label}
        </span>
        <div className='mt-1 text-sm'>{children}</div>
      </div>
    </div>
  )
}

function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className='text-[10px] uppercase tracking-wider text-muted-foreground'>
        {label}
      </p>
      <div className='mt-1 text-sm'>{children}</div>
    </div>
  )
}

function assignmentLabel(action: string) {
  return (
    {
      ASSIGNED: 'Responsável atribuído',
      REASSIGNED: 'Responsável alterado',
      UNASSIGNED: 'Responsável removido',
      INVALIDATED: 'Atribuição invalidada',
    }[action] ?? action
  )
}

function assignmentPeople(previous: string | null, next: string | null) {
  if (previous && next) return `${previous} → ${next}`
  return next ?? previous
}
