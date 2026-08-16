import { passwordResetCodeRequestSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { verifyPasswordResetCode } from '@/lib/services/auth/password-reset'
import { requestIp } from '@/lib/services/security/request-identity'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { PASSWORD_RESET_COOKIE } from '@/server/email/password-reset'
import { verifyRecaptcha } from '@/server/recaptcha/verify-recaptcha'

export async function POST(request: Request) {
  try {
    const parsed = passwordResetCodeRequestSchema.safeParse(
      await request.json()
    )
    if (!parsed.success)
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          data: null,
        },
        { status: 422 }
      )
    const ip = requestIp(request.headers)
    const recaptcha = await verifyRecaptcha({
      token: parsed.data.recaptchaToken,
      expectedAction: RECAPTCHA_ACTIONS.passwordResetVerify,
      remoteIp: ip === 'unknown' ? null : ip,
    })
    if (!recaptcha.verified)
      return Response.json(
        {
          success: false,
          message: 'Não foi possível confirmar a verificação de segurança.',
          data: null,
        },
        { status: 403 }
      )
    const grant = await verifyPasswordResetCode(
      parsed.data.resetId,
      parsed.data.code
    )
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
  } catch (error) {
    return apiError(error, 'Não foi possível verificar o código.')
  }
}
