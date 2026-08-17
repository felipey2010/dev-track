import type { RequirementFormData } from '@/lib/requirements/validation'
import { apiRequest, jsonRequest } from './http'

export function createRequirement(
  projectId: string,
  input: RequirementFormData
) {
  return apiRequest<{ id: string; code: string }>(
    `/api/projects/${projectId}/requirements`,
    jsonRequest('POST', input)
  )
}

export function updateRequirement(
  projectId: string,
  requirementId: string,
  input: RequirementFormData
) {
  return apiRequest<{ id: string }>(
    `/api/projects/${projectId}/requirements/${requirementId}`,
    jsonRequest('PUT', input)
  )
}

export function deleteRequirement(projectId: string, requirementId: string) {
  return apiRequest<{ id: string }>(
    `/api/projects/${projectId}/requirements/${requirementId}`,
    { method: 'DELETE' }
  )
}
