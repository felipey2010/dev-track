import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { registrationRequestSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import {
  getRequestIp,
  verifyRecaptcha,
} from '@/server/recaptcha/verify-recaptcha'
import { USER_STATUS } from '@/lib/auth/constants'

export async function POST(request: Request) {
  try {
    const parsed = registrationRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          data: null,
        },
        { status: 422 }
      )
    }
    const verification = await verifyRecaptcha({
      token: parsed.data.recaptchaToken,
      expectedAction: RECAPTCHA_ACTIONS.registration,
      remoteIp: getRequestIp(request.headers),
    })
    if (!verification.verified)
      return Response.json(
        {
          success: false,
          message: 'Não foi possível confirmar a verificação de segurança.',
          data: { verification },
        },
        { status: 403 }
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
          status: USER_STATUS.PENDING,
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
          metadata_json: { status: USER_STATUS.PENDING, method: 'credentials' },
        },
      }),
    ])
    return apiSuccess(
      'Conta criada. Aguarde a aprovação de um administrador.',
      { status: USER_STATUS.PENDING, verification },
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
