import { z } from 'zod'

export const requirementWorkflowActionSchema = z.enum([
  'START_DEVELOPMENT',
  'CLAIM_DEVELOPMENT',
  'READY_FOR_TESTING',
  'CLAIM_TESTING',
  'COMPLETE',
  'RETURN_TO_DEVELOPMENT',
])

export type RequirementWorkflowAction = z.infer<
  typeof requirementWorkflowActionSchema
>
