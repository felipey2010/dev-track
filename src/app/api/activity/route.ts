import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireActiveUser } from '@/server/authorization/session'
export async function GET() {
  try {
    const user = await requireActiveUser()
    const projectScope =
      user.system_role === 'ADMIN'
        ? undefined
        : await prisma.projects.findMany({
            where: {
              OR: [
                { teams: { leader_id: user.id } },
                { teams: { team_members: { some: { user_id: user.id } } } },
              ],
            },
            select: { id: true, requirements: { select: { id: true } } },
          })
    const entityIds = projectScope?.flatMap((project) => [
      project.id,
      ...project.requirements.map((requirement) => requirement.id),
    ])
    return apiSuccess(
      'Atividades carregadas.',
      await prisma.audit_logs.findMany({
        select: {
          id: true,
          action: true,
          actor_name_snapshot: true,
          entity_type: true,
          created_at: true,
        },
        where: entityIds ? { entity_id: { in: entityIds } } : undefined,
        orderBy: { created_at: 'desc' },
        take: 6,
      })
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar as atividades.')
  }
}
