import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export const registrationSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome completo.'),
    email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .regex(/[A-Za-z]/, 'A senha deve conter uma letra.')
      .regex(/[0-9]/, 'A senha deve conter um número.'),
    passwordConfirmation: z.string(),
    acceptedTerms: z.literal(true, {
      error: 'Você precisa aceitar os termos e a política de privacidade.',
    }),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  })

export type RegistrationInput = z.infer<typeof registrationSchema>
