import { apiError, apiSuccess } from '@/lib/http'
import { getPagination } from '@/lib/pagination'
import { listUsersExcept } from '@/lib/services/users'
import { requireAdmin } from '@/server/authorization/session'

export async function GET(request: Request) {
  try {
    const currentUser = await requireAdmin()
    const { page, pageSize, skip } = getPagination(request)
    const search =
      new URL(request.url).searchParams.get('search')?.trim().slice(0, 100) ??
      ''
    return apiSuccess(
      'Usuários carregados.',
      await listUsersExcept(currentUser.id, page, pageSize, skip, search)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os usuários.')
  }
}
