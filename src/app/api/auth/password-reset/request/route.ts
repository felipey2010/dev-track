import { passwordResetRequestSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { requestPasswordReset } from '@/lib/services/auth/password-reset'
import { requestIp } from '@/lib/services/security/request-identity'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { verifyRecaptcha } from '@/server/recaptcha/verify-recaptcha'

const GENERIC_MESSAGE =
  'Se o e-mail estiver cadastrado, enviaremos um código de verificação.'

export async function POST(request: Request) {
  try {
    const parsed = passwordResetRequestSchema.safeParse(await request.json())
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
      expectedAction: RECAPTCHA_ACTIONS.passwordResetRequest,
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
    return apiSuccess(
      GENERIC_MESSAGE,
      await requestPasswordReset(parsed.data.email, ip)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível iniciar a redefinição de senha.')
  }
}
