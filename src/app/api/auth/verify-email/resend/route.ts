import { resendEmailVerificationSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { resendRegistrationCode } from '@/lib/services/auth/email-verification'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { requestIp } from '@/lib/services/security/request-identity'
import { verifyRecaptcha } from '@/server/recaptcha/verify-recaptcha'

export async function POST(request: Request) {
  try {
    const parsed = resendEmailVerificationSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        { success: false, message: 'Solicitação inválida.', data: null },
        { status: 422 }
      )
    const ip = requestIp(request.headers)
    const recaptcha = await verifyRecaptcha({
      token: parsed.data.recaptchaToken,
      expectedAction: RECAPTCHA_ACTIONS.emailVerificationResend,
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
      'Enviamos um novo código para seu e-mail.',
      await resendRegistrationCode(parsed.data.verificationId)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível reenviar o código.')
  }
}
