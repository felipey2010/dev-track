import { apiError, apiSuccess } from '@/lib/http'
import { getPagination } from '@/lib/pagination'
import { listActivity } from '@/lib/services/activity'
import { requireActiveUser } from '@/server/authorization/session'

export async function GET(request: Request) {
  try {
    return apiSuccess(
      'Atividades carregadas.',
      await listActivity(await requireActiveUser(), getPagination(request))
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar as atividades.')
  }
}
