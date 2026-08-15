import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireActiveUser } from '@/server/authorization/session'
import { getPagination, paginated } from '@/lib/pagination'

export async function GET(request: Request) {
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
    const where = entityIds ? { entity_id: { in: entityIds } } : undefined
    const { page, pageSize, skip } = getPagination(request)
    const [items, totalItems] = await prisma.$transaction([
      prisma.audit_logs.findMany({
        select: {
          id: true,
          action: true,
          actor_name_snapshot: true,
          entity_type: true,
          created_at: true,
        },
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.audit_logs.count({ where }),
    ])
    return apiSuccess(
      'Atividades carregadas.',
      paginated(items, totalItems, page, pageSize)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar as atividades.')
  }
}
