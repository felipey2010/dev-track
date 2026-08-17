import type { RequirementWorkflowAction } from '@/lib/requirements/workflow'
import { apiRequest, jsonRequest } from './http'

export function executeRequirementWorkflow(
  projectId: string,
  requirementId: string,
  action: RequirementWorkflowAction
) {
  return apiRequest<{ id: string; action: RequirementWorkflowAction }>(
    `/api/projects/${projectId}/requirements/${requirementId}/workflow`,
    jsonRequest('POST', { action })
  )
}
