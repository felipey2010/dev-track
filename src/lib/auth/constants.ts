export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
  REJECTED: 'REJECTED',
} as const

export const RATE_LIMIT_ERROR_CODE = 'rate_limit_exceeded'

export const USER_ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const
