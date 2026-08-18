import { z } from 'zod'
import { sanitizeMultiline, sanitizeSingleLine } from '@/lib/security/sanitize'

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.')

const techStackSchema = z
  .array(
    z
      .string()
      .transform(sanitizeSingleLine)
      .pipe(
        z
          .string()
          .max(40, 'Cada tecnologia deve ter no máximo 40 caracteres.')
      )
  )
  .max(20, 'Informe no máximo 20 tecnologias.')
  .transform((technologies) => {
    const seen = new Set<string>()
    return technologies.filter((technology) => {
      if (!technology) return false
      const key = technology.toLocaleLowerCase('pt-BR')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

export const projectFormSchema = z
  .object({
    name: z
      .string()
      .transform(sanitizeSingleLine)
      .pipe(z.string().min(2, 'Informe o nome do projeto.').max(160)),
    description: z
      .string()
      .transform(sanitizeMultiline)
      .pipe(z.string().min(2, 'Informe a descrição.').max(5000)),
    client: z.string().transform(sanitizeSingleLine).pipe(z.string().max(160)),
    teamId: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{1,128}$/, 'Equipe inválida.'),
    startDate: dateOnly,
    expectedCompletionDate: z.union([dateOnly, z.literal('')]),
    techStack: techStackSchema,
    status: z.enum([
      'PLANNING',
      'IN_DEVELOPMENT',
      'TESTING',
      'COMPLETED',
      'ON_HOLD',
      'CANCELLED',
    ]),
  })
  .refine(
    (value) =>
      !value.expectedCompletionDate ||
      value.expectedCompletionDate >= value.startDate,
    {
      message: 'A conclusão prevista deve ser posterior ao início.',
      path: ['expectedCompletionDate'],
    }
  )
export type ProjectFormInput = z.input<typeof projectFormSchema>
export type ProjectFormData = z.output<typeof projectFormSchema>

export const projectCreateSchema = projectFormSchema.refine(
  (value) => value.status === 'PLANNING' || value.status === 'IN_DEVELOPMENT',
  { message: 'Status inicial inválido.', path: ['status'] }
)
