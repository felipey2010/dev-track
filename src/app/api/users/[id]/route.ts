import { apiError, apiSuccess } from '@/lib/http'
import { updateUserAccess } from '@/lib/services/users'
import { userAccessFormSchema } from '@/lib/users/validation'
import { identifierSchema } from '@/lib/validation/common'
import { requireAdmin } from '@/server/authorization/session'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin()
    const targetId = identifierSchema.safeParse((await params).id)
    if (!targetId.success)
      return Response.json(
        { success: false, message: 'Usuário não encontrado.', data: null },
        { status: 404 }
      )

    const input = userAccessFormSchema.safeParse(await request.json())
    if (!input.success)
      return Response.json(
        { success: false, message: 'Papel ou situação inválidos.', data: null },
        { status: 422 }
      )

    return apiSuccess(
      'Acesso do usuário atualizado.',
      await updateUserAccess({
        targetId: targetId.data,
        ...input.data,
        actor,
      })
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar o usuário.')
  }
}
