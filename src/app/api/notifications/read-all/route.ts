import { apiError, apiSuccess } from '@/lib/http'
import { markAllNotificationsRead } from '@/lib/services/notifications'
import { requireActiveUser } from '@/server/authorization/session'

export async function PATCH() {
  try {
    const user = await requireActiveUser()
    return apiSuccess(
      'Notificações marcadas como lidas.',
      await markAllNotificationsRead(user.id)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar as notificações.')
  }
}
