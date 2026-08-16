import type { NextRequest } from 'next/server'
import { passwordResetFormSchema } from '@/lib/auth/validation'
import { apiError, apiSuccess } from '@/lib/http'
import { completePasswordReset } from '@/lib/services/auth/password-reset'
import { PASSWORD_RESET_COOKIE } from '@/server/email/password-reset'

export async function POST(request: NextRequest) {
  try {
    const parsed = passwordResetFormSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          data: null,
        },
        { status: 422 }
      )
    const cookie = request.cookies.get(PASSWORD_RESET_COOKIE)?.value
    const separator = cookie?.indexOf('.') ?? -1
    if (
      !cookie ||
      separator < 1 ||
      cookie.slice(0, separator) !== parsed.data.resetId
    )
      return Response.json(
        {
          success: false,
          message: 'Autorização inválida ou expirada.',
          data: null,
        },
        { status: 401 }
      )
    const data = await completePasswordReset(
      parsed.data.resetId,
      cookie.slice(separator + 1),
      parsed.data.password
    )
    const response = apiSuccess('Senha redefinida com sucesso.', data)
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
