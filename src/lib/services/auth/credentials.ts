import 'server-only'

import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import { USER_STATUS } from '@/lib/auth/constants'
import { prisma } from '@/lib/prisma'
import {
  RATE_LIMIT_POLICIES,
  clearRateLimit,
  enforceRateLimit,
} from '@/lib/services/security/rate-limit'
import { compare } from 'bcryptjs'

export async function authenticateCredentials(input: {
  email: string
  password: string
  requestIp: string
}) {
  await enforceRateLimit(
    'login-ip',
    input.requestIp,
    RATE_LIMIT_POLICIES.loginIp
  )
  const accountKey = await enforceRateLimit(
    'login-account',
    input.email,
    RATE_LIMIT_POLICIES.loginAccount
  )
  const user = await prisma.users.findUnique({ where: { email: input.email } })
  if (!user?.password_hash) return null

  const passwordMatches = await compare(input.password, user.password_hash)
  if (!passwordMatches || user.status === USER_STATUS.REJECTED) return null
  if (!user.email_verified && user.status !== USER_STATUS.ACTIVE) {
    const completedPasswordReset = await prisma.audit_logs.findFirst({
      where: {
        entity_type: 'USER',
        entity_id: user.id,
        action: AUDIT_ACTIONS.userPasswordReset,
      },
      select: { id: true },
    })
    if (!completedPasswordReset) return null
    await prisma.users.update({
      where: { id: user.id },
      data: { email_verified: new Date() },
    })
  }
  await clearRateLimit(accountKey)
  return user
}
