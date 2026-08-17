import { sanitizeMultiline, sanitizeSingleLine } from '@/lib/security/sanitize'
import { z } from 'zod'

const optionalDate = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
  z.literal(''),
])

export const requirementFormSchema = z.object({
  title: z
    .string()
    .transform(sanitizeSingleLine)
    .pipe(z.string().min(2, 'Informe o título do requisito.').max(200)),
  description: z
    .string()
    .transform(sanitizeMultiline)
    .pipe(z.string().min(2, 'Informe a descrição.').max(5000)),
  type: z.enum(['FUNCTIONAL', 'NON_FUNCTIONAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  deadline: optionalDate,
})

export type RequirementFormInput = z.input<typeof requirementFormSchema>
export type RequirementFormData = z.output<typeof requirementFormSchema>
