import type { ApiResponse } from '@/lib/api'

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

export async function apiRequest<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, init)
  const body = (await response.json()) as ApiResponse<T>
  if (!response.ok || !body.success || body.data === null)
    throw new ApiClientError(body.message, response.status)
  return body.data
}

export function jsonRequest(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body: unknown
): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
