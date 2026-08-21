import { apiError, apiSuccess } from '@/lib/http'
import { getPagination } from '@/lib/pagination'
import { projectCreateSchema } from '@/lib/projects/validation'
import { createProject, listProjects } from '@/lib/services/projects'
import { requireActiveUser } from '@/server/authorization/session'
import { project_status } from '@/generated/prisma/enums'

export async function GET(request: Request) {
  try {
    const actor = await requireActiveUser()
    const pagination = getPagination(request)
    const parameters = new URL(request.url).searchParams
    const enabled = parameters.has('page')
    const search = parameters.get('search')?.trim().slice(0, 100) ?? ''
    const requestedStatus = parameters.get('status')
    const status = Object.values(project_status).includes(
      requestedStatus as project_status
    )
      ? (requestedStatus as project_status)
      : undefined
    const teamId = parameters.get('teamId')?.trim() || undefined
    return apiSuccess(
      'Projetos carregados.',
      await listProjects(actor, {
        ...pagination,
        enabled,
        search,
        status,
        teamId,
      })
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar os projetos.')
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActiveUser()
    const parsed = projectCreateSchema.safeParse(await request.json())
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
