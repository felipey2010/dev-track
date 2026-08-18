import { AUDIT_ACTIONS } from '@/lib/audit/constants'
import {
  RateLimitCredentialsError,
  RecaptchaCredentialsError,
} from '@/lib/auth/errors'
import { credentialsSchema } from '@/lib/auth/validation'
import { prisma } from '@/lib/prisma'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/constants'
import { normalizeEmail, sanitizeSingleLine } from '@/lib/security/sanitize'
import { authenticateCredentials } from '@/lib/services/auth/credentials'
import { requestIp } from '@/lib/services/security/request-identity'
import { emailVerificationIdentifier } from '@/server/email/email-verification'
import { ApplicationError } from '@/server/errors/application-error'
import {
  getRequestIp,
  verifyRecaptcha,
} from '@/server/recaptcha/verify-recaptcha'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { randomUUID } from 'node:crypto'
import { USER_ROLE, USER_STATUS } from './lib/auth/constants'

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
        recaptchaToken: { label: 'reCAPTCHA token', type: 'hidden' },
      },
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const verification = await verifyRecaptcha({
          token: parsed.data.recaptchaToken,
          expectedAction: RECAPTCHA_ACTIONS.login,
          remoteIp: getRequestIp(request.headers),
        })
        if (!verification.verified) throw new RecaptchaCredentialsError()

        let user
        try {
          user = await authenticateCredentials({
            email: parsed.data.email,
            password: parsed.data.password,
            requestIp: requestIp(request.headers),
          })
        } catch (error) {
          if (error instanceof ApplicationError && error.status === 429)
            throw new RateLimitCredentialsError()
          throw error
        }
        if (!user) return null

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
    async signIn({ account, profile, user }) {
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

      if (existingUser?.status === USER_STATUS.REJECTED) return false

      const image =
        typeof profile?.picture === 'string' ? profile.picture : user.image

      await prisma.$transaction(async (transaction) => {
        if (!existingUser) {
          await transaction.users.create({
            data: {
              id: userId,
              name: profile?.name
                ? sanitizeSingleLine(profile.name)
                : email.split('@')[0],
              email,
              image: image ?? null,
              email_verified: new Date(),
              system_role: USER_ROLE.USER,
              status: USER_STATUS.PENDING,
            },
          })
          await transaction.audit_logs.create({
            data: {
              id: randomUUID(),
              entity_type: USER_ROLE.USER,
              entity_id: userId,
              action: AUDIT_ACTIONS.userRegistered,
              actor_user_id: userId,
              actor_name_snapshot: profile?.name
                ? sanitizeSingleLine(profile.name)
                : email.split('@')[0],
              actor_system_role_snapshot: USER_ROLE.USER,
              metadata_json: { status: USER_STATUS.PENDING, method: 'google' },
            },
          })
        } else if (!existingUser.email_verified) {
          await transaction.users.update({
            where: { id: existingUser.id },
            data: { email_verified: new Date() },
          })
          await transaction.verification_tokens.deleteMany({
            where: {
              identifier: emailVerificationIdentifier(existingUser.id),
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
