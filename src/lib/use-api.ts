'use client'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/client-api/http'

export function useApi<T>(key: string, url: string) {
  return useQuery({ queryKey: [key, url], queryFn: () => apiRequest<T>(url) })
}
