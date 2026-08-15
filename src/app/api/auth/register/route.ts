import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { USER_STATUS } from '@/lib/auth/constants'
import { registrationRequestSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import {
  EMAIL_VERIFICATION_TTL_MINUTES,
  emailVerificationIdentifier,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
  sendEmailVerificationCode,
} from '@/server/email/email-verification'
import {
  getRequestIp,
  verifyRecaptcha,
} from '@/server/recaptcha/verify-recaptcha'

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

    if (!verification.verified) {
      return Response.json(
        {
          success: false,
          message: 'Não foi possível confirmar a verificação de segurança.',
          data: { verification },
        },
        { status: 403 }
      )
    }

    const { name, email, password } = parsed.data
    const id = randomUUID()
    const code = generateEmailVerificationCode()
    const identifier = emailVerificationIdentifier(id)
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
          action: AUDIT_ACTIONS.userRegistered,
          actor_user_id: id,
          actor_name_snapshot: name,
          actor_system_role_snapshot: 'USER',
          metadata_json: { status: USER_STATUS.PENDING, method: 'credentials' },
        },
      }),
      prisma.verification_tokens.create({
        data: {
          identifier,
          token: hashEmailVerificationCode(id, code),
          expires: new Date(
            Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000
          ),
        },
      }),
    ])

    try {
      await sendEmailVerificationCode({ email, name, code })
    } catch (error) {
      await prisma.$transaction([
        prisma.verification_tokens.deleteMany({ where: { identifier } }),
        prisma.audit_logs.deleteMany({
          where: { entity_type: 'USER', entity_id: id },
        }),
        prisma.users.delete({ where: { id } }),
      ])
      throw error
    }

    return apiSuccess(
      'Conta criada. Enviamos um código de verificação para seu e-mail.',
      { status: USER_STATUS.PENDING, verification, verificationId: id },
      201
    )
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return Response.json(
        {
          success: false,
          message: 'Não foi possível criar a conta com estes dados.',
          data: null,
        },
        { status: 409 }
      )
    }
    return apiError(
      error,
      'Não foi possível criar a conta e enviar o código de verificação.'
    )
  }
}
