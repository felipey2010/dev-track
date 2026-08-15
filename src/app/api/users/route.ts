import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/authorization/session'
import { getPagination, paginated } from '@/lib/pagination'

export async function GET(request: Request) {
  try {
    const currentUser = await requireAdmin()
    const { page, pageSize, skip } = getPagination(request)
    const where = { id: { not: currentUser.id } }
    const [items, totalItems] = await prisma.$transaction([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
          system_role: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.users.count({ where }),
    ])
    return apiSuccess(
      'Usuários carregados.',
      paginated(items, totalItems, page, pageSize)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os usuários.')
  }
}
