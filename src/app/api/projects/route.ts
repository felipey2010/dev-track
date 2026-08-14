import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireActiveUser } from '@/server/authorization/session'
import { randomUUID } from 'node:crypto'
import { projectFormSchema } from '@/lib/projects/validation'

export async function GET() {
  try {
    const user = await requireActiveUser()
    const rows = await prisma.projects.findMany({
      where:
        user.system_role === 'ADMIN'
          ? undefined
          : {
              OR: [
                { teams: { leader_id: user.id } },
                { teams: { team_members: { some: { user_id: user.id } } } },
              ],
            },
      include: {
        teams: { include: { users: { select: { id: true, name: true } } } },
        requirements: { select: { status: true } },
      },
      orderBy: { updated_at: 'desc' },
    })
    const data = rows.map(({ requirements, teams, ...project }) => ({
      ...project,
      team: { id: teams.id, name: teams.name, leader: teams.users },
      requirementCount: requirements.length,
      completedRequirementCount: requirements.filter(
        (r) => r.status === 'COMPLETED'
      ).length,
      progress: requirements.length
        ? Math.round(
            (requirements.filter((r) => r.status === 'COMPLETED').length /
              requirements.length) *
              100
          )
        : 0,
    }))
    return apiSuccess('Projetos carregados.', data)
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os projetos.')
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActiveUser()
    const parsed = projectFormSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          data: null,
        },
        { status: 422 }
      )
    const team = await prisma.teams.findUnique({
      where: { id: parsed.data.teamId },
      include: { users: { select: { id: true, status: true } } },
    })
    if (!team?.users || team.users.status !== 'ACTIVE')
      return Response.json(
        {
          success: false,
          message: 'A equipe precisa ter uma liderança ativa.',
          data: null,
        },
        { status: 422 }
      )
    if (team.leader_id !== actor.id)
      return Response.json(
        {
          success: false,
          message: 'Somente a liderança da equipe pode criar este projeto.',
          data: null,
        },
        { status: 403 }
      )
    const id = randomUUID()
    await prisma.$transaction([
      prisma.projects.create({
        data: {
          id,
          name: parsed.data.name,
          description: parsed.data.description,
          client: parsed.data.client || null,
          team_id: team.id,
          start_date: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
          expected_completion_date: parsed.data.expectedCompletionDate
            ? new Date(`${parsed.data.expectedCompletionDate}T00:00:00.000Z`)
            : null,
          status: parsed.data.status,
          created_by_id: actor.id,
        },
      }),
      prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'PROJECT',
          entity_id: id,
          action: 'PROJECT_CREATED',
          actor_user_id: actor.id,
          actor_name_snapshot: actor.name,
          actor_system_role_snapshot: actor.system_role,
          metadata_json: { teamId: team.id, status: parsed.data.status },
        },
      }),
    ])
    return apiSuccess('Projeto criado com sucesso.', { id }, 201)
  } catch (error) {
    return apiError(error, 'Não foi possível criar o projeto.')
  }
}
