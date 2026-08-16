import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/http'
import { updateUserStatus } from '@/lib/services/users'
import { identifierSchema } from '@/lib/validation/common'
import { requireAdmin } from '@/server/authorization/session'

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'REJECTED']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin()
    const parsedId = identifierSchema.safeParse((await params).id)
    if (!parsedId.success)
      return Response.json(
        { success: false, message: 'Usuário não encontrado.', data: null },
        { status: 404 }
      )
    const parsed = statusSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        { success: false, message: 'Situação de conta inválida.', data: null },
        { status: 422 }
      )
    return apiSuccess(
      'Situação da conta atualizada.',
      await updateUserStatus({
        targetId: parsedId.data,
        status: parsed.data.status,
        actor,
      })
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar a conta.')
  }
}
