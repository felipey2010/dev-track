export const RECAPTCHA_ACTIONS = {
  login: 'login',
  registration: 'registration',
  emailVerificationResend: 'email_verification_resend',
  passwordResetRequest: 'password_reset_request',
  passwordResetVerify: 'password_reset_verify',
} as const

export const RECAPTCHA_ERROR_CODE = 'recaptcha_verification_failed'

export type RecaptchaAction =
  (typeof RECAPTCHA_ACTIONS)[keyof typeof RECAPTCHA_ACTIONS]
