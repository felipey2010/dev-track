import { apiRequest, jsonRequest } from './http'
import type { UserAccessFormData } from '@/lib/users/validation'

export function changeUserStatus(id: string, status: string) {
  return apiRequest<{ id: string; status: string }>(
    `/api/users/${id}/status`,
    jsonRequest('PATCH', { status })
  )
}

export function updateUserAccess(id: string, input: UserAccessFormData) {
  return apiRequest<{ id: string; status: string; systemRole: string }>(
    `/api/users/${id}`,
    jsonRequest('PATCH', input)
  )
}
