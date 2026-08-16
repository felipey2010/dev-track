import { apiRequest, jsonRequest } from './http'

export function changeUserStatus(id: string, status: string) {
  return apiRequest<{ id: string; status: string }>(
    `/api/users/${id}/status`,
    jsonRequest('PATCH', { status })
  )
}
