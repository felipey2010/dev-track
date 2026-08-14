import 'server-only'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { identifierSchema } from '@/lib/validation/common'
import {
  ApplicationError,
  AuthenticationError,
  AuthorizationError,
} from '@/server/errors/application-error'

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.users.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
      system_role: true,
    },
  })
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser()
  if (!user) throw new AuthenticationError()
  return user
}

export async function requireActiveUser() {
  const user = await requireAuthenticatedUser()
  if (user.status !== 'ACTIVE')
    throw new AuthorizationError('Sua conta não está ativa.')
  return user
}

export async function requireAdmin() {
  const user = await requireActiveUser()
  if (user.system_role !== 'ADMIN') throw new AuthorizationError()
  return user
}

export async function requireProjectAccess(projectId: string) {
  const safeProjectId = identifierSchema.parse(projectId)
  const user = await requireActiveUser()
  const project = await prisma.projects.findUnique({
    where: { id: safeProjectId },
    select: { team_id: true, teams: { select: { leader_id: true } } },
  })
  if (!project) throw new ApplicationError('Projeto não encontrado.', 404)
  if (user.system_role === 'ADMIN' || project.teams.leader_id === user.id)
    return user
  const membership = await prisma.team_members.findUnique({
    where: { team_id_user_id: { team_id: project.team_id, user_id: user.id } },
  })
  if (!membership) throw new ApplicationError('Projeto não encontrado.', 404)
  return user
}

export async function requireProjectManager(projectId: string) {
  const safeProjectId = identifierSchema.parse(projectId)
  const user = await requireActiveUser()
  const project = await prisma.projects.findUnique({
    where: { id: safeProjectId },
    select: { teams: { select: { leader_id: true } } },
  })
  if (!project) throw new ApplicationError('Projeto não encontrado.', 404)
  if (project.teams.leader_id !== user.id) throw new AuthorizationError()
  return user
}
