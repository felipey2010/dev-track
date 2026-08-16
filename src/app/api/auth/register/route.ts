import { registrationRequestSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import {
  registerCredentialUser,
  RegistrationConflictError,
} from '@/lib/services/auth/registration'
import { requestIp } from '@/lib/services/security/request-identity'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { verifyRecaptcha } from '@/server/recaptcha/verify-recaptcha'

export async function POST(request: Request) {
  try {
    const parsed = registrationRequestSchema.safeParse(await request.json())
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
    const verification = await verifyRecaptcha({
      token: parsed.data.recaptchaToken,
      expectedAction: RECAPTCHA_ACTIONS.registration,
      remoteIp: ip === 'unknown' ? null : ip,
    })
    if (!verification.verified)
      return Response.json(
        {
          success: false,
          message: 'Não foi possível confirmar a verificação de segurança.',
          data: null,
        },
        { status: 403 }
      )

    const data = await registerCredentialUser({ ...parsed.data, requestIp: ip })
    return apiSuccess(
      'Conta criada. Enviamos um código de verificação para seu e-mail.',
      data,
      201
    )
  } catch (error) {
    if (error instanceof RegistrationConflictError)
      return Response.json(
        {
          success: false,
          message: 'Não foi possível criar a conta com estes dados.',
          data: null,
        },
        { status: 409 }
      )
    return apiError(
      error,
      'Não foi possível criar a conta e enviar o código de verificação.'
    )
  }
}
