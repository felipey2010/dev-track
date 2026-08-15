import 'server-only'

import { createHmac, randomInt } from 'node:crypto'
import { sendMail } from './email-transporter'
import { APP_IDENTITY } from '@/lib/app-identity'

export const EMAIL_VERIFICATION_TTL_MINUTES = 10
export const EMAIL_VERIFICATION_IDENTIFIER_PREFIX = 'email-verification:'

export function generateEmailVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export function hashEmailVerificationCode(userId: string, code: string) {
  const secret =
    process.env.EMAIL_VERIFICATION_SECRET || process.env.AUTH_SECRET
  if (!secret) throw new Error('EMAIL_VERIFICATION_SECRET is not configured')

  return createHmac('sha256', secret).update(`${userId}:${code}`).digest('hex')
}

export function emailVerificationIdentifier(userId: string) {
  return `${EMAIL_VERIFICATION_IDENTIFIER_PREFIX}${userId}`
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }
  return value.replace(/[&<>'"]/g, (character) => entities[character])
}

export async function sendEmailVerificationCode({
  email,
  name,
  code,
}: {
  email: string
  name: string
  code: string
}) {
  const safeName = escapeHtml(name)

  await sendMail(
    email,
    `Confirme seu e-mail no ${APP_IDENTITY.name}`,
    `<div style="font-family:Arial,sans-serif;color:#17202a;line-height:1.5">
      <h1 style="font-size:20px">Confirme seu e-mail</h1>
      <p>Olá, ${safeName}.</p>
      <p>Use o código abaixo para concluir seu cadastro no ${APP_IDENTITY.name}:</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:8px">${code}</p>
      <p>O código expira em ${EMAIL_VERIFICATION_TTL_MINUTES} minutos.</p>
      <p>Se você não solicitou este cadastro, ignore esta mensagem.</p>
    </div>`
  )
}
