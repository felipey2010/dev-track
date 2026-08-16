import { apiError, apiSuccess } from '@/lib/http'
import { getPagination } from '@/lib/pagination'
import { projectFormSchema } from '@/lib/projects/validation'
import { createProject, listProjects } from '@/lib/services/projects'
import { requireActiveUser } from '@/server/authorization/session'

export async function GET(request: Request) {
  try {
    const actor = await requireActiveUser()
    const pagination = getPagination(request)
    const enabled = new URL(request.url).searchParams.has('page')
    return apiSuccess(
      'Projetos carregados.',
      await listProjects(actor, { ...pagination, enabled })
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os projetos.')
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActiveUser()
    const parsed = projectFormSchema.safeParse(await request.json())
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
      'Projeto criado com sucesso.',
      await createProject(parsed.data, actor),
      201
    )
  } catch (error) {
    return apiError(error, 'Não foi possível criar o projeto.')
  }
}
