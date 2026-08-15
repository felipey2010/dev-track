import { z } from 'zod'
import { normalizeEmail, sanitizeSingleLine } from '@/lib/security/sanitize'
import { recaptchaTokenSchema } from '@/lib/recaptcha/validation'

export const loginFormSchema = z.object({
  email: z.string().transform(normalizeEmail).pipe(z.email()),
  password: z.string().min(1),
})

export const credentialsSchema = loginFormSchema.extend({
  recaptchaToken: recaptchaTokenSchema,
})

export const registrationSchema = z
  .object({
    name: z
      .string()
      .transform(sanitizeSingleLine)
      .pipe(z.string().min(2, 'Informe seu nome completo.').max(120)),
    email: z
      .string()
      .transform(normalizeEmail)
      .pipe(z.email('Informe um e-mail válido.').max(254)),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .regex(/[A-Za-z]/, 'A senha deve conter uma letra.')
      .regex(/[0-9]/, 'A senha deve conter um número.'),
    passwordConfirmation: z.string(),
    acceptedTerms: z.boolean().refine((value) => value, {
      message: 'Você precisa aceitar os termos e a política de privacidade.',
    }),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  })

export type RegistrationInput = z.infer<typeof registrationSchema>
export type CredentialsInput = z.infer<typeof loginFormSchema>

export const registrationRequestSchema = registrationSchema.safeExtend({
  recaptchaToken: recaptchaTokenSchema,
})

export const emailVerificationSchema = z.object({
  verificationId: z.string().uuid('Identificador de verificação inválido.'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Informe o código de 6 dígitos.'),
})

export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>

export const resendEmailVerificationSchema = z.object({
  verificationId: emailVerificationSchema.shape.verificationId,
  recaptchaToken: recaptchaTokenSchema,
})

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha deve conter uma letra.')
  .regex(/[0-9]/, 'A senha deve conter um número.')

export const passwordResetRequestFormSchema = z.object({
  email: z
    .string()
    .transform(normalizeEmail)
    .pipe(z.email('Informe um e-mail válido.').max(254)),
})
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestFormSchema
>

export const passwordResetRequestSchema = passwordResetRequestFormSchema.extend(
  { recaptchaToken: recaptchaTokenSchema }
)

export const passwordResetCodeSchema = z.object({
  resetId: z.string().uuid('Identificador inválido.'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Informe o código de 6 dígitos.'),
})
export type PasswordResetCodeInput = z.infer<typeof passwordResetCodeSchema>
export const passwordResetCodeRequestSchema = passwordResetCodeSchema.extend({
  recaptchaToken: recaptchaTokenSchema,
})

export const passwordResetFormSchema = z
  .object({
    resetId: passwordResetCodeSchema.shape.resetId,
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  })
export type PasswordResetInput = z.infer<typeof passwordResetFormSchema>
