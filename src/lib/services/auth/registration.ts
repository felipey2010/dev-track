import 'server-only'

import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { USER_STATUS } from '@/lib/auth/constants'
import { prisma } from '@/lib/prisma'
import {
  EMAIL_VERIFICATION_TTL_MINUTES,
  emailVerificationIdentifier,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
  sendEmailVerificationCode,
} from '@/server/email/email-verification'
import {
  RATE_LIMIT_POLICIES,
  enforceRateLimit,
} from '@/lib/services/security/rate-limit'

export async function registerCredentialUser(input: {
  name: string
  email: string
  password: string
  requestIp: string
}) {
  await enforceRateLimit(
    'registration',
    input.requestIp,
    RATE_LIMIT_POLICIES.registration
  )
  const id = randomUUID()
  const code = generateEmailVerificationCode()
  const identifier = emailVerificationIdentifier(id)

  try {
    await prisma.$transaction([
      prisma.users.create({
        data: {
          id,
          name: input.name,
          email: input.email,
          password_hash: await hash(input.password, 12),
          system_role: 'USER',
          status: USER_STATUS.PENDING,
        },
      }),
      prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          entity_type: 'USER',
          entity_id: id,
          action: AUDIT_ACTIONS.userRegistered,
          actor_user_id: id,
          actor_name_snapshot: input.name,
          actor_system_role_snapshot: 'USER',
          metadata_json: { status: USER_STATUS.PENDING, method: 'credentials' },
        },
      }),
      prisma.verification_tokens.create({
        data: {
          identifier,
          token: hashEmailVerificationCode(id, code),
          expires: new Date(
            Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60_000
          ),
        },
      }),
    ])
    await sendEmailVerificationCode({
      email: input.email,
      name: input.name,
      code,
    })
  } catch (error) {
    await prisma.$transaction([
      prisma.verification_tokens.deleteMany({ where: { identifier } }),
      prisma.audit_logs.deleteMany({
        where: { entity_type: 'USER', entity_id: id },
      }),
      prisma.users.deleteMany({ where: { id } }),
    ])
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new RegistrationConflictError()
    }
    throw error
  }
  return { status: USER_STATUS.PENDING, verificationId: id }
}

export class RegistrationConflictError extends Error {}
