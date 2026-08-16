import { apiRequest, jsonRequest } from './http'
import type { ProjectFormData } from '@/lib/projects/validation'

export function createProject(input: ProjectFormData) {
  return apiRequest<{ id: string }>('/api/projects', jsonRequest('POST', input))
}
