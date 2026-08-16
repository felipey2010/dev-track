import type {
  EmailVerificationInput,
  PasswordResetCodeInput,
  PasswordResetInput,
  PasswordResetRequestInput,
  RegistrationInput,
} from '@/lib/auth/validation'
import { apiRequest, jsonRequest } from './http'

export const registerAccount = (
  input: RegistrationInput & { recaptchaToken: string }
) =>
  apiRequest<{ verificationId: string }>(
    '/api/auth/register',
    jsonRequest('POST', input)
  )

export const verifyRegistrationEmail = (input: EmailVerificationInput) =>
  apiRequest<{ verified: boolean }>(
    '/api/auth/verify-email',
    jsonRequest('POST', input)
  )

export const resendRegistrationCode = (input: {
  verificationId: string
  recaptchaToken: string
}) =>
  apiRequest<{ sent: boolean }>(
    '/api/auth/verify-email/resend',
    jsonRequest('POST', input)
  )

export const requestPasswordReset = (
  input: PasswordResetRequestInput & { recaptchaToken: string }
) =>
  apiRequest<{ resetId: string }>(
    '/api/auth/password-reset/request',
    jsonRequest('POST', input)
  )

export const verifyPasswordResetCode = (
  input: PasswordResetCodeInput & { recaptchaToken: string }
) =>
  apiRequest<{ verified: boolean }>(
    '/api/auth/password-reset/verify',
    jsonRequest('POST', input)
  )

export const completePasswordReset = (input: PasswordResetInput) =>
  apiRequest<{ reset: boolean }>(
    '/api/auth/password-reset/complete',
    jsonRequest('POST', input)
  )
