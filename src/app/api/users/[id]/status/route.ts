import { randomUUID } from 'node:crypto'
import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/authorization/session'
import { identifierSchema } from '@/lib/validation/common'

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
    const id = parsedId.data
    const parsed = statusSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        { success: false, message: 'Situação de conta inválida.', data: null },
        { status: 422 }
      )
    if (actor.id === id && parsed.data.status !== 'ACTIVE')
      return Response.json(
        {
          success: false,
          message: 'Você não pode suspender ou rejeitar a própria conta.',
          data: null,
        },
        { status: 422 }
      )
    const target = await prisma.users.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    })
    if (!target)
      return Response.json(
        { success: false, message: 'Usuário não encontrado.', data: null },
        { status: 404 }
      )
    await prisma.$transaction([
      prisma.users.update({
        where: { id },
        data: { status: parsed.data.status },
      }),
      prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'USER',
          entity_id: id,
          action: AUDIT_ACTIONS.userStatusChanged[parsed.data.status],
          actor_user_id: actor.id,
          actor_name_snapshot: actor.name,
          actor_system_role_snapshot: actor.system_role,
          metadata_json: {
            previousStatus: target.status,
            newStatus: parsed.data.status,
          },
        },
      }),
    ])
    return apiSuccess('Situação da conta atualizada.', {
      id,
      status: parsed.data.status,
    })
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar a conta.')
  }
}
