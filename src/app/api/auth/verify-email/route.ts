import { randomUUID } from 'node:crypto'
import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { emailVerificationSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import {
  emailVerificationIdentifier,
  hashEmailVerificationCode,
} from '@/server/email/email-verification'

export async function POST(request: Request) {
  try {
    const parsed = emailVerificationSchema.safeParse(await request.json())
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

    const { verificationId, code } = parsed.data
    const identifier = emailVerificationIdentifier(verificationId)
    const token = hashEmailVerificationCode(verificationId, code)
    const verification = await prisma.verification_tokens.findUnique({
      where: { identifier_token: { identifier, token } },
    })

    if (!verification) {
      return Response.json(
        { success: false, message: 'Código inválido.', data: null },
        { status: 400 }
      )
    }

    if (verification.expires <= new Date()) {
      await prisma.verification_tokens.deleteMany({ where: { identifier } })
      return Response.json(
        {
          success: false,
          message: 'Este código expirou. Faça um novo cadastro.',
          data: null,
        },
        { status: 410 }
      )
    }

    const user = await prisma.users.findUnique({
      where: { id: verificationId },
      select: {
        id: true,
        name: true,
        password_hash: true,
        email_verified: true,
      },
    })

    if (!user?.password_hash) {
      return Response.json(
        { success: false, message: 'Verificação inválida.', data: null },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: { email_verified: user.email_verified ?? new Date() },
      }),
      prisma.verification_tokens.deleteMany({ where: { identifier } }),
      prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'USER',
          entity_id: user.id,
          action: AUDIT_ACTIONS.userEmailVerified,
          actor_user_id: user.id,
          actor_name_snapshot: user.name,
          actor_system_role_snapshot: 'USER',
          metadata_json: { method: 'otp' },
        },
      }),
    ])

    return apiSuccess('E-mail verificado com sucesso.', { verified: true })
  } catch (error) {
    return apiError(error, 'Não foi possível verificar o e-mail.')
  }
}
