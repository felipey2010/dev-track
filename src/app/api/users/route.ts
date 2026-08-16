import { apiError, apiSuccess } from '@/lib/http'
import { getPagination } from '@/lib/pagination'
import { listUsersExcept } from '@/lib/services/users'
import { requireAdmin } from '@/server/authorization/session'

export async function GET(request: Request) {
  try {
    const currentUser = await requireAdmin()
    const { page, pageSize, skip } = getPagination(request)
    return apiSuccess(
      'Usuários carregados.',
      await listUsersExcept(currentUser.id, page, pageSize, skip)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os usuários.')
  }
}
