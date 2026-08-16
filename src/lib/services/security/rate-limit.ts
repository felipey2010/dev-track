import 'server-only'

import { createHmac } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { ApplicationError } from '@/server/errors/application-error'

type RateLimitPolicy = {
  limit: number
  windowMs: number
  blockMs: number
}

export const RATE_LIMIT_POLICIES = {
  loginIp: { limit: 20, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  loginAccount: { limit: 8, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  registration: { limit: 5, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
  passwordResetRequest: {
    limit: 5,
    windowMs: 60 * 60_000,
    blockMs: 60 * 60_000,
  },
  otpVerification: { limit: 5, windowMs: 10 * 60_000, blockMs: 30 * 60_000 },
  otpResend: { limit: 3, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
} as const satisfies Record<string, RateLimitPolicy>

export async function enforceRateLimit(
  scope: string,
  subject: string,
  policy: RateLimitPolicy
) {
  const key = rateLimitKey(scope, subject)
  const allowed = await updateRateLimit(key, policy)
  if (!allowed)
    throw new ApplicationError(
      'Muitas tentativas. Aguarde e tente novamente.',
      429
    )
  return key
}

export async function clearRateLimit(key: string) {
  await prisma.security_rate_limits.deleteMany({ where: { key } })
}

function rateLimitKey(scope: string, subject: string) {
  const secret = process.env.RATE_LIMIT_SECRET || process.env.AUTH_SECRET
  if (!secret) throw new Error('RATE_LIMIT_SECRET is not configured')
  const digest = createHmac('sha256', secret).update(subject).digest('hex')
  return `${scope}:${digest}`
}

async function updateRateLimit(key: string, policy: RateLimitPolicy) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const now = new Date()
          const row = await transaction.security_rate_limits.findUnique({
            where: { key },
          })
          if (!row) {
            await transaction.security_rate_limits.create({
              data: { key, attempts: 1, window_started: now, updated_at: now },
            })
            return true
          }
          if (row.blocked_until && row.blocked_until > now) return false
          const windowExpired =
            now.getTime() - row.window_started.getTime() >= policy.windowMs
          const attempts = windowExpired ? 1 : row.attempts + 1
          const blocked = attempts > policy.limit
          await transaction.security_rate_limits.update({
            where: { key },
            data: {
              attempts,
              window_started: windowExpired ? now : row.window_started,
              blocked_until: blocked
                ? new Date(now.getTime() + policy.blockMs)
                : null,
              updated_at: now,
            },
          })
          return !blocked
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        !['P2002', 'P2034'].includes(error.code) ||
        attempt === 2
      )
        throw error
    }
  }
  return false
}
