export const AUDIT_ACTIONS = {
  userRegistered: 'USER_REGISTERED',
  userEmailVerified: 'USER_EMAIL_VERIFIED',
  userPasswordReset: 'USER_PASSWORD_RESET',
  projectCreated: 'PROJECT_CREATED',
  teamCreated: 'TEAM_CREATED',
  teamUpdated: 'TEAM_UPDATED',
  teamDeleted: 'TEAM_DELETED',
  userStatusChanged: {
    PENDING: 'USER_STATUS_PENDING',
    ACTIVE: 'USER_STATUS_ACTIVE',
    SUSPENDED: 'USER_STATUS_SUSPENDED',
    REJECTED: 'USER_STATUS_REJECTED',
  },
} as const
