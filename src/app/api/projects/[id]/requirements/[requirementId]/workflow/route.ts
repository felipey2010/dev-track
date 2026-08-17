import { apiError, apiSuccess } from '@/lib/http'
import { requirementWorkflowActionSchema } from '@/lib/requirements/workflow'
import { executeRequirementWorkflow } from '@/lib/services/requirement-workflow'
import { identifierSchema } from '@/lib/validation/common'
import { requireActiveUser } from '@/server/authorization/session'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; requirementId: string }> }
) {
  try {
    const routeParams = await params
    const projectId = identifierSchema.safeParse(routeParams.id)
    const requirementId = identifierSchema.safeParse(routeParams.requirementId)
    if (!projectId.success || !requirementId.success)
      return Response.json(
        { success: false, message: 'Requisito não encontrado.', data: null },
        { status: 404 }
      )
    const actor = await requireActiveUser()
    const body = (await request.json()) as { action?: unknown }
    const parsed = requirementWorkflowActionSchema.safeParse(body.action)
    if (!parsed.success)
      return Response.json(
        { success: false, message: 'Ação de fluxo inválida.', data: null },
        { status: 422 }
      )
    return apiSuccess(
      'Fluxo do requisito atualizado.',
      await executeRequirementWorkflow(
        projectId.data,
        requirementId.data,
        parsed.data,
        actor
      )
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar o fluxo do requisito.')
  }
}
