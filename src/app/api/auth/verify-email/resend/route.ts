import { resendEmailVerificationSchema } from '@/lib/auth/validation'
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

const RESEND_INTERVAL_MS = 60 * 1000

export async function POST(request: Request) {
  try {
    const parsed = resendEmailVerificationSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, message: 'Solicitação inválida.', data: null },
        { status: 422 }
      )
    }

    const recaptcha = await verifyRecaptcha({
      token: parsed.data.recaptchaToken,
      expectedAction: RECAPTCHA_ACTIONS.emailVerificationResend,
      remoteIp: getRequestIp(request.headers),
    })

    if (!recaptcha.verified) {
      return Response.json(
        {
          success: false,
          message: 'Não foi possível confirmar a verificação de segurança.',
          data: { verification: recaptcha },
        },
        { status: 403 }
      )
    }

    const user = await prisma.users.findUnique({
      where: { id: parsed.data.verificationId },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        email_verified: true,
      },
    })

    if (!user?.password_hash || user.email_verified) {
      return Response.json(
        { success: false, message: 'Solicitação inválida.', data: null },
        { status: 400 }
      )
    }

    const identifier = emailVerificationIdentifier(user.id)
    const latestToken = await prisma.verification_tokens.findFirst({
      where: { identifier },
      orderBy: { expires: 'desc' },
    })

    const issuedAt = latestToken
      ? latestToken.expires.getTime() -
        EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000
      : 0

    if (Date.now() - issuedAt < RESEND_INTERVAL_MS) {
      return Response.json(
        {
          success: false,
          message: 'Aguarde um minuto antes de reenviar o código.',
          data: null,
        },
        { status: 429 }
      )
    }

    const code = generateEmailVerificationCode()
    const token = hashEmailVerificationCode(user.id, code)
    const expires = new Date(
      Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000
    )
    await prisma.verification_tokens.create({
      data: { identifier, token, expires },
    })

    try {
      await sendEmailVerificationCode({
        email: user.email,
        name: user.name,
        code,
      })
      await prisma.verification_tokens.deleteMany({
        where: { identifier, token: { not: token } },
      })
    } catch (error) {
      await prisma.verification_tokens.deleteMany({
        where: { identifier, token },
      })
      throw error
    }

    return apiSuccess('Enviamos um novo código para seu e-mail.', {
      sent: true,
    })
  } catch (error) {
    return apiError(error, 'Não foi possível reenviar o código.')
  }
}
