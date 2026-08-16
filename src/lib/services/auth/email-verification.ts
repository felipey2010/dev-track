import 'server-only'

import { randomUUID } from 'node:crypto'
import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { prisma } from '@/lib/prisma'
import { ApplicationError } from '@/server/errors/application-error'
import {
  EMAIL_VERIFICATION_TTL_MINUTES,
  emailVerificationIdentifier,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
  sendEmailVerificationCode,
} from '@/server/email/email-verification'
import {
  RATE_LIMIT_POLICIES,
  clearRateLimit,
  enforceRateLimit,
} from '@/lib/services/security/rate-limit'

export async function verifyRegistrationEmail(
  verificationId: string,
  code: string
) {
  const attemptKey = await enforceRateLimit(
    'registration-otp',
    verificationId,
    RATE_LIMIT_POLICIES.otpVerification
  )
  const identifier = emailVerificationIdentifier(verificationId)
  const token = hashEmailVerificationCode(verificationId, code)
  const verification = await prisma.verification_tokens.findUnique({
    where: { identifier_token: { identifier, token } },
  })
  if (!verification) throw new ApplicationError('Código inválido.', 400)
  if (verification.expires <= new Date()) {
    await prisma.verification_tokens.deleteMany({ where: { identifier } })
    throw new ApplicationError(
      'Este código expirou. Solicite um novo código.',
      410
    )
  }
  const user = await prisma.users.findUnique({
    where: { id: verificationId },
    select: { id: true, name: true, password_hash: true, email_verified: true },
  })
  if (!user?.password_hash)
    throw new ApplicationError('Verificação inválida.', 400)
  await prisma.$transaction([
    prisma.users.update({
      where: { id: user.id },
      data: { email_verified: user.email_verified ?? new Date() },
    }),
    prisma.verification_tokens.deleteMany({ where: { identifier } }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: 'USER',
        entity_id: user.id,
        action: AUDIT_ACTIONS.userEmailVerified,
        actor_user_id: user.id,
        actor_name_snapshot: user.name,
        actor_system_role_snapshot: 'USER',
        metadata_json: { method: 'otp' },
      },
    }),
  ])
  await clearRateLimit(attemptKey)
  return { verified: true }
}

export async function resendRegistrationCode(verificationId: string) {
  await enforceRateLimit(
    'registration-otp-resend',
    verificationId,
    RATE_LIMIT_POLICIES.otpResend
  )
  const user = await prisma.users.findUnique({
    where: { id: verificationId },
    select: {
      id: true,
      name: true,
      email: true,
      password_hash: true,
      email_verified: true,
    },
  })
  if (!user?.password_hash || user.email_verified)
    throw new ApplicationError('Solicitação inválida.', 400)
  const identifier = emailVerificationIdentifier(user.id)
  const code = generateEmailVerificationCode()
  const token = hashEmailVerificationCode(user.id, code)
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60_000)
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
  return { sent: true }
}
