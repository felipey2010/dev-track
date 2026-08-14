import { CredentialsSignin } from 'next-auth'
import { RECAPTCHA_ERROR_CODE } from '@/lib/recaptcha/constants'

export class RecaptchaCredentialsError extends CredentialsSignin {
  code = RECAPTCHA_ERROR_CODE
}
