import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { registrationSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const parsed = registrationSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          data: null,
        },
        { status: 422 }
      )
    const { name, email, password } = parsed.data
    const id = randomUUID()
    await prisma.$transaction([
      prisma.users.create({
        data: {
          id,
          name,
          email,
          password_hash: await hash(password, 12),
          system_role: 'USER',
          status: 'PENDING',
        },
      }),
      prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'USER',
          entity_id: id,
          action: 'USER_REGISTERED',
          actor_user_id: id,
          actor_name_snapshot: name,
          actor_system_role_snapshot: 'USER',
          metadata_json: { status: 'PENDING', method: 'credentials' },
        },
      }),
    ])
    return apiSuccess(
      'Conta criada. Aguarde a aprovação de um administrador.',
      { status: 'PENDING' },
      201
    )
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      return Response.json(
        {
          success: false,
          message: 'Não foi possível criar a conta com estes dados.',
          data: null,
        },
        { status: 409 }
      )
    return apiError(error, 'Não foi possível criar a conta.')
  }
}
