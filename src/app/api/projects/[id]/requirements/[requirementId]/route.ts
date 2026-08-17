import { apiError, apiSuccess } from '@/lib/http'
import { requirementFormSchema } from '@/lib/requirements/validation'
import {
  deleteRequirement,
  updateRequirement,
} from '@/lib/services/requirements'
import { identifierSchema } from '@/lib/validation/common'
import { requireProjectManagerOrAdmin } from '@/server/authorization/session'

async function identifiers(context: {
  params: Promise<{ id: string; requirementId: string }>
}) {
  const params = await context.params
  const projectId = identifierSchema.safeParse(params.id)
  const requirementId = identifierSchema.safeParse(params.requirementId)
  return projectId.success && requirementId.success
    ? { projectId: projectId.data, requirementId: requirementId.data }
    : null
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; requirementId: string }> }
) {
  try {
    const ids = await identifiers(context)
    if (!ids)
      return Response.json(
        { success: false, message: 'Requisito não encontrado.', data: null },
        { status: 404 }
      )
    const actor = await requireProjectManagerOrAdmin(ids.projectId)
    const parsed = requirementFormSchema.safeParse(await request.json())
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
      'Requisito atualizado com sucesso.',
      await updateRequirement(
        ids.projectId,
        ids.requirementId,
        parsed.data,
        actor
      )
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar o requisito.')
  }
}

export const PATCH = PUT

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string; requirementId: string }> }
) {
  try {
    const ids = await identifiers(context)
    if (!ids)
      return Response.json(
        { success: false, message: 'Requisito não encontrado.', data: null },
        { status: 404 }
      )
    const actor = await requireProjectManagerOrAdmin(ids.projectId)
    return apiSuccess(
      'Requisito excluído com sucesso.',
      await deleteRequirement(ids.projectId, ids.requirementId, actor)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível excluir o requisito.')
  }
}
