'use client'

import { usePathname } from 'next/navigation'

export function useActiveRouteCheck(route: string) {
  const pathname = usePathname()
  const isActive =
    route.length === 1 ? pathname === route : pathname.search(route) !== -1

  return [isActive] as const
}
