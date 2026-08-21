import { apiError, apiSuccess } from '@/lib/http'
import { getPagination } from '@/lib/pagination'
import { createTeam, listTeams } from '@/lib/services/teams'
import { teamFormSchema } from '@/lib/teams/validation'
import { requireActiveUser, requireAdmin } from '@/server/authorization/session'

export async function GET(request: Request) {
  try {
    const actor = await requireActiveUser()
    const pagination = getPagination(request)
    const parameters = new URL(request.url).searchParams
    const enabled = parameters.has('page')
    const search = parameters.get('search')?.trim().slice(0, 100) ?? ''
    const leadership = parameters.get('leadership')
    const projects = parameters.get('projects')
    return apiSuccess(
      'Equipes carregadas.',
      await listTeams(actor, {
        ...pagination,
        enabled,
        search,
        leadership:
          leadership === 'WITH' || leadership === 'WITHOUT'
            ? leadership
            : undefined,
        projects:
          projects === 'WITH' || projects === 'WITHOUT' ? projects : undefined,
      })
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar as equipes.')
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin()
    const parsed = teamFormSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          data: null,
        },
        { status: 422 }
      )
    return apiSuccess(
      'Equipe criada com sucesso.',
      await createTeam(parsed.data, actor),
      201
    )
  } catch (error) {
    return apiError(error, 'Não foi possível criar a equipe.')
  }
}
