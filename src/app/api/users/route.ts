import { apiError, apiSuccess } from '@/lib/http'
import { getPagination } from '@/lib/pagination'
import { listUsersExcept } from '@/lib/services/users'
import { requireAdmin } from '@/server/authorization/session'
import { system_role, user_status } from '@/generated/prisma/enums'

export async function GET(request: Request) {
  try {
    const currentUser = await requireAdmin()
    const { page, pageSize, skip } = getPagination(request)
    const parameters = new URL(request.url).searchParams
    const search = parameters.get('search')?.trim().slice(0, 100) ?? ''
    const requestedRole = parameters.get('role')
    const requestedStatus = parameters.get('status')
    const role = Object.values(system_role).includes(
      requestedRole as system_role
    )
      ? (requestedRole as system_role)
      : undefined
    const status = Object.values(user_status).includes(
      requestedStatus as user_status
    )
      ? (requestedStatus as user_status)
      : undefined
    return apiSuccess(
      'Usuários carregados.',
      await listUsersExcept(currentUser.id, page, pageSize, skip, {
        search,
        role,
        status,
      })
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os usuários.')
  }
}
