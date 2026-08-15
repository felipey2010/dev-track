import { randomBytes } from 'node:crypto'
import { passwordResetCodeRequestSchema } from '@/lib/auth/validation'
import { apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { hashEmailVerificationCode } from '@/server/email/email-verification'
import {
  PASSWORD_RESET_CODE_PREFIX,
  PASSWORD_RESET_COOKIE,
  PASSWORD_RESET_GRANT_PREFIX,
  passwordResetIdentifier,
} from '@/server/email/password-reset'
import {
  getRequestIp,
  verifyRecaptcha,
} from '@/server/recaptcha/verify-recaptcha'

export async function POST(request: Request) {
  const parsed = passwordResetCodeRequestSchema.safeParse(await request.json())
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

  const recaptcha = await verifyRecaptcha({
    token: parsed.data.recaptchaToken,
    expectedAction: RECAPTCHA_ACTIONS.passwordResetVerify,
    remoteIp: getRequestIp(request.headers),
  })

  if (!recaptcha.verified) {
    return Response.json(
      {
        success: false,
        message: 'Não foi possível confirmar a verificação de segurança.',
        data: null,
      },
      { status: 403 }
    )
  }

  const prefix = `${PASSWORD_RESET_CODE_PREFIX}${parsed.data.resetId}:`
  const token = hashEmailVerificationCode(parsed.data.resetId, parsed.data.code)
  const verification = await prisma.verification_tokens.findFirst({
    where: { identifier: { startsWith: prefix }, token },
  })

  if (!verification || verification.expires <= new Date()) {
    return Response.json(
      { success: false, message: 'Código inválido ou expirado.', data: null },
      { status: 400 }
    )
  }

  const userId = verification.identifier.slice(prefix.length)
  const grant = randomBytes(32).toString('base64url')
  const grantIdentifier = passwordResetIdentifier(
    PASSWORD_RESET_GRANT_PREFIX,
    parsed.data.resetId,
    userId
  )

  await prisma.$transaction([
    prisma.verification_tokens.delete({
      where: {
        identifier_token: { identifier: verification.identifier, token },
      },
    }),
    prisma.verification_tokens.create({
      data: {
        identifier: grantIdentifier,
        token: hashEmailVerificationCode(parsed.data.resetId, grant),
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    }),
  ])

  const response = apiSuccess('Código confirmado.', { verified: true })
  response.cookies.set(
    PASSWORD_RESET_COOKIE,
    `${parsed.data.resetId}.${grant}`,
    {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/password-reset',
      maxAge: 10 * 60,
    }
  )
  return response
}
