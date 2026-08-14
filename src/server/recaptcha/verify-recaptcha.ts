import 'server-only'
import { z } from 'zod'
import type { RecaptchaAction } from '@/lib/recaptcha/constants'
import { recaptchaTokenSchema } from '@/lib/recaptcha/validation'

const SITE_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
const googleResponseSchema = z.object({
  success: z.boolean(),
  score: z.number().min(0).max(1).optional(),
  action: z.string().optional(),
  hostname: z.string().optional(),
  challenge_ts: z.string().optional(),
  'error-codes': z.array(z.string()).optional(),
})

export type RecaptchaVerification = {
  verified: boolean
  score: number | null
  action: string | null
  reason:
    | 'verified'
    | 'invalid_token'
    | 'action_mismatch'
    | 'low_score'
    | 'hostname_mismatch'
    | 'not_configured'
    | 'verification_unavailable'
}

export async function verifyRecaptcha({
  token,
  expectedAction,
  remoteIp,
}: {
  token: string
  expectedAction: RecaptchaAction
  remoteIp?: string | null
}): Promise<RecaptchaVerification> {
  const parsedToken = recaptchaTokenSchema.safeParse(token)
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return failure('not_configured')
  if (!parsedToken.success) return failure('invalid_token')

  const body = new URLSearchParams({ secret, response: parsedToken.data })
  if (remoteIp) body.set('remoteip', remoteIp)
  try {
    const response = await fetch(SITE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return failure('verification_unavailable')
    const parsed = googleResponseSchema.safeParse(await response.json())
    if (!parsed.success || !parsed.data.success) return failure('invalid_token')
    if (parsed.data.action !== expectedAction)
      return failure('action_mismatch', parsed.data)
    const minimumScore = readMinimumScore()
    if (
      typeof parsed.data.score !== 'number' ||
      parsed.data.score < minimumScore
    )
      return failure('low_score', parsed.data)
    const allowedHostnames = readAllowedHostnames()
    if (
      allowedHostnames.length &&
      (!parsed.data.hostname ||
        !allowedHostnames.includes(parsed.data.hostname.toLowerCase()))
    )
      return failure('hostname_mismatch', parsed.data)
    return {
      verified: true,
      score: parsed.data.score,
      action: parsed.data.action,
      reason: 'verified',
    }
  } catch {
    return failure('verification_unavailable')
  }
}

function readMinimumScore() {
  const configured = Number(process.env.RECAPTCHA_MIN_SCORE ?? '0.5')
  return Number.isFinite(configured) && configured >= 0 && configured <= 1
    ? configured
    : 0.5
}
function readAllowedHostnames() {
  return (process.env.RECAPTCHA_ALLOWED_HOSTNAMES ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}
function failure(
  reason: Exclude<RecaptchaVerification['reason'], 'verified'>,
  response?: { score?: number; action?: string }
): RecaptchaVerification {
  return {
    verified: false,
    score: response?.score ?? null,
    action: response?.action ?? null,
    reason,
  }
}

export function getRequestIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const real = headers.get('x-real-ip')?.trim()
  const value = forwarded || real
  return value && /^[0-9a-fA-F:.]{3,45}$/.test(value) ? value : null
}
