import { emailVerificationSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { verifyRegistrationEmail } from '@/lib/services/auth/email-verification'

export async function POST(request: Request) {
  try {
    const parsed = emailVerificationSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          data: null,
        },
        { status: 422 }
      )
    return apiSuccess(
      'E-mail verificado com sucesso.',
      await verifyRegistrationEmail(
        parsed.data.verificationId,
        parsed.data.code
      )
    )
  } catch (error) {
    return apiError(error, 'Não foi possível verificar o e-mail.')
  }
}
