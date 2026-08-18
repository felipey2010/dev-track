import 'server-only'

import { hash } from 'bcryptjs'
import { randomBytes, randomUUID } from 'node:crypto'
import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { prisma } from '@/lib/prisma'
import { ApplicationError } from '@/server/errors/application-error'
import {
  EMAIL_VERIFICATION_TTL_MINUTES,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
} from '@/server/email/email-verification'
import {
  PASSWORD_RESET_CODE_PREFIX,
  PASSWORD_RESET_GRANT_PREFIX,
  passwordResetIdentifier,
  sendPasswordResetCode,
} from '@/server/email/password-reset'
import {
  RATE_LIMIT_POLICIES,
  clearRateLimit,
  enforceRateLimit,
} from '@/lib/services/security/rate-limit'
import { USER_ROLE } from '@/lib/auth/constants'

export async function requestPasswordReset(email: string, requestIp: string) {
  await enforceRateLimit(
    'password-reset-ip',
    requestIp,
    RATE_LIMIT_POLICIES.passwordResetRequest
  )
  await enforceRateLimit(
    'password-reset-account',
    email,
    RATE_LIMIT_POLICIES.passwordResetRequest
  )
  const resetId = randomUUID()
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, email: true, password_hash: true },
  })
  if (user?.password_hash) {
    const code = generateEmailVerificationCode()
    const identifier = passwordResetIdentifier(
      PASSWORD_RESET_CODE_PREFIX,
      resetId,
      user.id
    )
    await prisma.verification_tokens.create({
      data: {
        identifier,
        token: hashEmailVerificationCode(resetId, code),
        expires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60_000),
      },
    })
    try {
      await sendPasswordResetCode(user.email, code)
    } catch (error) {
      await prisma.verification_tokens.deleteMany({ where: { identifier } })
      console.error('Unable to send password reset email', error)
    }
  }
  return { resetId }
}

export async function verifyPasswordResetCode(resetId: string, code: string) {
  const attemptKey = await enforceRateLimit(
    'password-reset-otp',
    resetId,
    RATE_LIMIT_POLICIES.otpVerification
  )
  const prefix = `${PASSWORD_RESET_CODE_PREFIX}${resetId}:`
  const token = hashEmailVerificationCode(resetId, code)
  const verification = await prisma.verification_tokens.findFirst({
    where: { identifier: { startsWith: prefix }, token },
  })
  if (!verification || verification.expires <= new Date())
    throw new ApplicationError('Código inválido ou expirado.', 400)
  const userId = verification.identifier.slice(prefix.length)
  const grant = randomBytes(32).toString('base64url')
  const grantIdentifier = passwordResetIdentifier(
    PASSWORD_RESET_GRANT_PREFIX,
    resetId,
    userId
  )
  await prisma.$transaction([
    prisma.verification_tokens.delete({
      where: {
        identifier_token: { identifier: verification.identifier, token },
      },
    }),
    prisma.verification_tokens.create({
      data: {
        identifier: grantIdentifier,
        token: hashEmailVerificationCode(resetId, grant),
        expires: new Date(Date.now() + 10 * 60_000),
      },
    }),
  ])
  await clearRateLimit(attemptKey)
  return grant
}

export async function completePasswordReset(
  resetId: string,
  grant: string,
  password: string
) {
  const prefix = `${PASSWORD_RESET_GRANT_PREFIX}${resetId}:`
  const token = hashEmailVerificationCode(resetId, grant)
  const verification = await prisma.verification_tokens.findFirst({
    where: { identifier: { startsWith: prefix }, token },
  })
  if (!verification || verification.expires <= new Date())
    throw new ApplicationError('Autorização inválida ou expirada.', 401)
  const userId = verification.identifier.slice(prefix.length)
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, name: true, system_role: true },
  })
  if (!user)
    throw new ApplicationError('Autorização inválida ou expirada.', 401)
  await prisma.$transaction([
    prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: await hash(password, 12),
        email_verified: new Date(),
      },
    }),
    prisma.verification_tokens.delete({
      where: {
        identifier_token: { identifier: verification.identifier, token },
      },
    }),
    prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        entity_type: USER_ROLE.USER,
        entity_id: user.id,
        action: AUDIT_ACTIONS.userPasswordReset,
        actor_user_id: user.id,
        actor_name_snapshot: user.name,
        actor_system_role_snapshot: user.system_role,
        metadata_json: { method: 'email_otp' },
      },
    }),
  ])
  return { reset: true }
}
