import { apiError, apiSuccess } from '@/lib/http'
import { getProject } from '@/lib/services/projects'
import { identifierSchema } from '@/lib/validation/common'
import { requireProjectAccess } from '@/server/authorization/session'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parsed = identifierSchema.safeParse((await params).id)
    if (!parsed.success)
      return Response.json(
        { success: false, message: 'Projeto não encontrado.', data: null },
        { status: 404 }
      )
    await requireProjectAccess(parsed.data)
    return apiSuccess('Projeto carregado.', await getProject(parsed.data))
  } catch (error) {
    return apiError(error, 'Não foi possível carregar o projeto.')
  }
}
