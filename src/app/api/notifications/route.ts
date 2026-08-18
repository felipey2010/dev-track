import { apiError, apiSuccess } from '@/lib/http'
import { getPagination } from '@/lib/pagination'
import { listNotifications } from '@/lib/services/notifications'
import { requireActiveUser } from '@/server/authorization/session'

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser()
    const { page, pageSize, skip } = getPagination(request)
    return apiSuccess(
      'Notificações carregadas.',
      await listNotifications(user.id, page, pageSize, skip)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar as notificações.')
  }
}
