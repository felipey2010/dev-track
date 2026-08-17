import { apiRequest, jsonRequest } from './http'
import type { ProjectFormData } from '@/lib/projects/validation'

export function createProject(input: ProjectFormData) {
  return apiRequest<{ id: string }>('/api/projects', jsonRequest('POST', input))
}

export function updateProject(id: string, input: ProjectFormData) {
  return apiRequest<{ id: string }>(
    `/api/projects/${id}`,
    jsonRequest('PUT', input)
  )
}

export function deleteProject(id: string) {
  return apiRequest<{ id: string }>(`/api/projects/${id}`, {
    method: 'DELETE',
  })
}
