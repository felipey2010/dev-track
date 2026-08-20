import { z } from 'zod'

export const userAccessFormSchema = z.object({
  systemRole: z.enum(['USER', 'ADMIN']),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']),
})

export type UserAccessFormData = z.infer<typeof userAccessFormSchema>
