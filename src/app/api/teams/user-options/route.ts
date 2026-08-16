import { apiError, apiSuccess } from '@/lib/http'
import { listTeamUserOptions } from '@/lib/services/teams'
import { requireAdmin } from '@/server/authorization/session'

export async function GET() {
  try {
    await requireAdmin()
    return apiSuccess(
      'Usuários ativos carregados.',
      await listTeamUserOptions()
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os usuários ativos.')
  }
}
