import { z } from 'zod'

export const recaptchaTokenSchema = z
  .string()
  .trim()
  .min(20, 'A verificação do reCAPTCHA é obrigatória.')
  .max(4096, 'Token do reCAPTCHA inválido.')
