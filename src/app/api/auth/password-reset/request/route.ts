import { randomUUID } from 'node:crypto'
import { passwordResetRequestSchema } from '@/lib/auth/validation'
import { apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import {
  EMAIL_VERIFICATION_TTL_MINUTES,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
} from '@/server/email/email-verification'
import {
  PASSWORD_RESET_CODE_PREFIX,
  passwordResetIdentifier,
  sendPasswordResetCode,
} from '@/server/email/password-reset'
import {
  getRequestIp,
  verifyRecaptcha,
} from '@/server/recaptcha/verify-recaptcha'

const GENERIC_MESSAGE =
  'Se o e-mail estiver cadastrado, enviaremos um código de verificação.'

export async function POST(request: Request) {
  const resetId = randomUUID()
  const parsed = passwordResetRequestSchema.safeParse(await request.json())
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
    expectedAction: RECAPTCHA_ACTIONS.passwordResetRequest,
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

  const user = await prisma.users.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, password_hash: true },
  })

  if (user?.password_hash) {
    const code = generateEmailVerificationCode()
    const identifier = passwordResetIdentifier(
      PASSWORD_RESET_CODE_PREFIX,
      resetId,
      user.id
    )

    const token = hashEmailVerificationCode(resetId, code)
    await prisma.verification_tokens.create({
      data: {
        identifier,
        token,
        expires: new Date(
          Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000
        ),
      },
    })
    try {
      await sendPasswordResetCode(user.email, code)
    } catch (error) {
      await prisma.verification_tokens.deleteMany({ where: { identifier } })
      console.error('Unable to send password reset email', error)
    }
  }

  return apiSuccess(GENERIC_MESSAGE, { resetId })
}
