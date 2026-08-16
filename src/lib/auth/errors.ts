import { CredentialsSignin } from 'next-auth'
import { RECAPTCHA_ERROR_CODE } from '@/lib/recaptcha/constants'
import { RATE_LIMIT_ERROR_CODE } from '@/lib/auth/constants'

export class RecaptchaCredentialsError extends CredentialsSignin {
  code = RECAPTCHA_ERROR_CODE
}

export class RateLimitCredentialsError extends CredentialsSignin {
  code = RATE_LIMIT_ERROR_CODE
}
