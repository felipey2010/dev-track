import type { DefaultSession } from 'next-auth'

type ACCOUNT_STATUS = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'

type ACCOUNT_ROLE = 'USER' | 'ADMIN'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      systemRole: ACCOUNT_ROLE
      status: ACCOUNT_STATUS
    }
  }

  interface User {
    systemRole: ACCOUNT_ROLE
    status: ACCOUNT_STATUS
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    systemRole?: ACCOUNT_ROLE
    status?: ACCOUNT_STATUS
  }
}
