import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/authorization/session'
export async function GET() {
  try {
    await requireAdmin()
    return apiSuccess(
      'Usuários carregados.',
      await prisma.users.findMany({
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
      })
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os usuários.')
  }
}
