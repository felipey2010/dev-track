import { apiError, apiSuccess } from '@/lib/http'
import { requirementFormSchema } from '@/lib/requirements/validation'
import { createRequirement } from '@/lib/services/requirements'
import { identifierSchema } from '@/lib/validation/common'
import { requireProjectManagerOrAdmin } from '@/server/authorization/session'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = identifierSchema.safeParse((await params).id)
    if (!projectId.success)
      return Response.json(
        { success: false, message: 'Projeto não encontrado.', data: null },
        { status: 404 }
      )
    const actor = await requireProjectManagerOrAdmin(projectId.data)
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
      'Requisito criado com sucesso.',
      await createRequirement(projectId.data, parsed.data, actor),
      201
    )
  } catch (error) {
    return apiError(error, 'Não foi possível criar o requisito.')
  }
}
