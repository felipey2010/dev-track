import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      systemRole: 'ADMIN' | 'USER'
      status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
    }
  }

  interface User {
    systemRole: 'ADMIN' | 'USER'
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    systemRole?: 'ADMIN' | 'USER'
    status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
  }
}
