import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { credentialsSchema } from '@/lib/auth/validation'
import { normalizeEmail, sanitizeSingleLine } from '@/lib/security/sanitize'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'seu-email@exemplo.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const user = await prisma.users.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user?.password_hash) return null

        const passwordMatches = await compare(
          parsed.data.password,
          user.password_hash
        )
        if (!passwordMatches || user.status === 'REJECTED') return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          systemRole: user.system_role,
          status: user.status,
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      issuer: 'https://accounts.google.com',
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true
      const email = profile?.email ? normalizeEmail(profile.email) : undefined
      if (!email) return false

      const existingAccount = await prisma.accounts.findUnique({
        where: {
          provider_provider_account_id: {
            provider: account.provider,
            provider_account_id: account.providerAccountId,
          },
        },
      })
      if (existingAccount) return true

      const existingUser = await prisma.users.findUnique({ where: { email } })
      const userId = existingUser?.id ?? randomUUID()
      if (existingUser?.status === 'REJECTED') return false

      await prisma.$transaction(async (transaction) => {
        if (!existingUser) {
          await transaction.users.create({
            data: {
              id: userId,
              name: profile?.name
                ? sanitizeSingleLine(profile.name)
                : email.split('@')[0],
              email,
              image:
                typeof profile?.picture === 'string' ? profile.picture : null,
              email_verified: new Date(),
              system_role: 'USER',
              status: 'PENDING',
            },
          })
          await transaction.audit_logs.create({
            data: {
              id: randomUUID(),
              entity_type: 'USER',
              entity_id: userId,
              action: 'USER_REGISTERED',
              actor_user_id: userId,
              actor_name_snapshot: profile?.name
                ? sanitizeSingleLine(profile.name)
                : email.split('@')[0],
              actor_system_role_snapshot: 'USER',
              metadata_json: { status: 'PENDING', method: 'google' },
            },
          })
        }
        await transaction.accounts.create({
          data: {
            id: randomUUID(),
            user_id: userId,
            type: account.type,
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state:
              typeof account.session_state === 'string'
                ? account.session_state
                : null,
          },
        })
      })
      return true
    },
    async jwt({ token, user, account, profile }) {
      let userId = user?.id ?? token.sub
      if (account?.provider === 'google' && profile?.email) {
        const databaseUser = await prisma.users.findUnique({
          where: { email: normalizeEmail(profile.email) },
          select: { id: true },
        })
        userId = databaseUser?.id
      }
      if (!userId) return token

      const currentUser = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
          system_role: true,
        },
      })
      if (!currentUser) return token

      token.sub = currentUser.id
      token.name = currentUser.name
      token.email = currentUser.email
      token.picture = currentUser.image
      token.status = currentUser.status
      token.systemRole = currentUser.system_role
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.status = token.status as typeof session.user.status
      session.user.systemRole =
        token.systemRole as typeof session.user.systemRole
      return session
    },
  },
})
