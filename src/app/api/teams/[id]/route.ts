import { apiError, apiSuccess } from '@/lib/http'
import { deleteTeam, getTeam, updateTeam } from '@/lib/services/teams'
import { teamFormSchema } from '@/lib/teams/validation'
import { identifierSchema } from '@/lib/validation/common'
import { requireActiveUser, requireAdmin } from '@/server/authorization/session'

async function idFrom(context: { params: Promise<{ id: string }> }) {
  const parsed = identifierSchema.safeParse((await context.params).id)
  return parsed.success ? parsed.data : null
}

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireActiveUser()
    const id = await idFrom(context)
    if (!id)
      return Response.json(
        { success: false, message: 'Equipe não encontrada.', data: null },
        { status: 404 }
      )
    return apiSuccess('Equipe carregada.', await getTeam(id, actor))
  } catch (error) {
    return apiError(error, 'Não foi possível carregar a equipe.')
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin()
    const id = await idFrom(context)
    if (!id)
      return Response.json(
        { success: false, message: 'Equipe não encontrada.', data: null },
        { status: 404 }
      )
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
      'Equipe atualizada com sucesso.',
      await updateTeam(id, parsed.data, actor)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar a equipe.')
  }
}

export const PATCH = PUT

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin()
    const id = await idFrom(context)
    if (!id)
      return Response.json(
        { success: false, message: 'Equipe não encontrada.', data: null },
        { status: 404 }
      )
    return apiSuccess(
      'Equipe excluída com sucesso.',
      await deleteTeam(id, actor)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível excluir a equipe.')
  }
}
