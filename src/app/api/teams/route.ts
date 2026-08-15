import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireActiveUser } from '@/server/authorization/session'
import { getPagination, paginated } from '@/lib/pagination'

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser()
    const parameters = new URL(request.url).searchParams
    const shouldPaginate = parameters.has('page')
    const { page, pageSize, skip } = getPagination(request)
    const where =
      user.system_role === 'ADMIN'
        ? undefined
        : {
            OR: [
              { leader_id: user.id },
              { team_members: { some: { user_id: user.id } } },
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
      skip: shouldPaginate ? skip : undefined,
      take: shouldPaginate ? pageSize : undefined,
    })
    const data = rows.map(({ team_members, ...t }) => ({
      ...t,
      canManage: t.leader_id === user.id,
      developerCount: team_members.filter((m) => m.role === 'DEVELOPER').length,
      testerCount: team_members.filter((m) => m.role === 'TESTER').length,
    }))
    if (!shouldPaginate) return apiSuccess('Equipes carregadas.', data)
    const totalItems = await prisma.teams.count({ where })
    return apiSuccess(
      'Equipes carregadas.',
      paginated(data, totalItems, page, pageSize)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar as equipes.')
  }
}
