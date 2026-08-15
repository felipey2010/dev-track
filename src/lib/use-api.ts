'use client'
import { useQuery } from '@tanstack/react-query'
import type { ApiResponse } from '@/lib/api'
async function request<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const body = (await response.json()) as ApiResponse<T>
  if (!response.ok || !body.success || body.data === null)
    throw new Error(body.message)
  return body.data
}
export function useApi<T>(key: string, url: string) {
  return useQuery({ queryKey: [key, url], queryFn: () => request<T>(url) })
}
