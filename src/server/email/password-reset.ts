import 'server-only'

import { sendMail } from './email-transporter'
import { APP_IDENTITY } from '@/lib/app-identity'
import { EMAIL_VERIFICATION_TTL_MINUTES } from './email-verification'

export const PASSWORD_RESET_CODE_PREFIX = 'password-reset-code:'
export const PASSWORD_RESET_GRANT_PREFIX = 'password-reset-grant:'
export const PASSWORD_RESET_COOKIE = 'dev-track-password-reset'

export function passwordResetIdentifier(
  prefix: string,
  resetId: string,
  userId: string
) {
  return `${prefix}${resetId}:${userId}`
}

export async function sendPasswordResetCode(email: string, code: string) {
  await sendMail(
    email,
    `Redefinição de senha do ${APP_IDENTITY.name}`,
    `<div style="font-family:Arial,sans-serif;color:#17202a;line-height:1.5">
      <h1 style="font-size:20px">Redefinir senha</h1>
      <p>Use o código abaixo para continuar a redefinição da sua senha:</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:8px">${code}</p>
      <p>O código expira em ${EMAIL_VERIFICATION_TTL_MINUTES} minutos.</p>
      <p>Se você não solicitou esta alteração, ignore esta mensagem.</p>
    </div>`
  )
}
