import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { passwordResetFormSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { hashEmailVerificationCode } from '@/server/email/email-verification'
import {
  PASSWORD_RESET_COOKIE,
  PASSWORD_RESET_GRANT_PREFIX,
} from '@/server/email/password-reset'

export async function POST(request: NextRequest) {
  try {
    const parsed = passwordResetFormSchema.safeParse(await request.json())
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

    const cookie = request.cookies.get(PASSWORD_RESET_COOKIE)?.value
    const separator = cookie?.indexOf('.') ?? -1
    if (
      !cookie ||
      separator < 1 ||
      cookie.slice(0, separator) !== parsed.data.resetId
    ) {
      return Response.json(
        {
          success: false,
          message: 'Autorização inválida ou expirada.',
          data: null,
        },
        { status: 401 }
      )
    }
    const grant = cookie.slice(separator + 1)
    const prefix = `${PASSWORD_RESET_GRANT_PREFIX}${parsed.data.resetId}:`
    const token = hashEmailVerificationCode(parsed.data.resetId, grant)
    const verification = await prisma.verification_tokens.findFirst({
      where: { identifier: { startsWith: prefix }, token },
    })
    if (!verification || verification.expires <= new Date()) {
      return Response.json(
        {
          success: false,
          message: 'Autorização inválida ou expirada.',
          data: null,
        },
        { status: 401 }
      )
    }
    const userId = verification.identifier.slice(prefix.length)
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true, system_role: true },
    })
    if (!user)
      return Response.json(
        {
          success: false,
          message: 'Autorização inválida ou expirada.',
          data: null,
        },
        { status: 401 }
      )

    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          password_hash: await hash(parsed.data.password, 12),
          email_verified: new Date(),
        },
      }),
      prisma.verification_tokens.delete({
        where: {
          identifier_token: { identifier: verification.identifier, token },
        },
      }),
      prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'USER',
          entity_id: user.id,
          action: AUDIT_ACTIONS.userPasswordReset,
          actor_user_id: user.id,
          actor_name_snapshot: user.name,
          actor_system_role_snapshot: user.system_role,
          metadata_json: { method: 'email_otp' },
        },
      }),
    ])

    const response = apiSuccess('Senha redefinida com sucesso.', {
      reset: true,
    })
    response.cookies.set(PASSWORD_RESET_COOKIE, '', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/password-reset',
      maxAge: 0,
    })
    return response
  } catch (error) {
    return apiError(error, 'Não foi possível redefinir a senha.')
  }
}
