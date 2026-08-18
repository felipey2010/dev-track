import { apiError, apiSuccess } from '@/lib/http'
import { markNotificationRead } from '@/lib/services/notifications'
import { identifierSchema } from '@/lib/validation/common'
import { requireActiveUser } from '@/server/authorization/session'

export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = identifierSchema.safeParse((await params).id)
    if (!id.success)
      return Response.json(
        { success: false, message: 'Notificação não encontrada.', data: null },
        { status: 404 }
      )
    const user = await requireActiveUser()
    return apiSuccess(
      'Notificação marcada como lida.',
      await markNotificationRead(id.data, user.id)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar a notificação.')
  }
}
