import type { TeamFormData } from '@/lib/teams/validation'
import { apiRequest, jsonRequest } from './http'

export function createTeam(input: TeamFormData) {
  return apiRequest<{ id: string }>('/api/teams', jsonRequest('POST', input))
}

export function updateTeam(id: string, input: TeamFormData) {
  return apiRequest<{ id: string }>(
    `/api/teams/${id}`,
    jsonRequest('PUT', input)
  )
}

export function deleteTeam(id: string) {
  return apiRequest<{ id: string }>(`/api/teams/${id}`, { method: 'DELETE' })
}
