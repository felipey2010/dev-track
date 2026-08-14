import { z } from 'zod'
export const identifierSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)
