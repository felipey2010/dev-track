import { sanitizeMultiline, sanitizeSingleLine } from '@/lib/security/sanitize'
import { identifierSchema } from '@/lib/validation/common'
import { z } from 'zod'

const memberSchema = z.object({
  userId: identifierSchema,
  role: z.enum(['DEVELOPER', 'TESTER']),
})

export const teamFormSchema = z
  .object({
    name: z
      .string()
      .transform(sanitizeSingleLine)
      .pipe(z.string().min(2, 'Informe o nome da equipe.').max(120)),
    description: z
      .string()
      .transform(sanitizeMultiline)
      .pipe(z.string().max(1000)),
    leaderId: z.union([identifierSchema, z.literal('')]),
    members: z.array(memberSchema).max(100, 'A equipe possui membros demais.'),
  })
  .superRefine((value, context) => {
    const ids = value.members.map((member) => member.userId)
    if (new Set(ids).size !== ids.length)
      context.addIssue({
        code: 'custom',
        path: ['members'],
        message: 'Um usuário não pode aparecer duas vezes na equipe.',
      })
    if (value.leaderId && ids.includes(value.leaderId))
      context.addIssue({
        code: 'custom',
        path: ['members'],
        message: 'A liderança não deve ser cadastrada também como membro.',
      })
  })

export type TeamFormData = z.output<typeof teamFormSchema>
