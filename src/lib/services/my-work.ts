import 'server-only'

import { prisma } from '@/lib/prisma'

export type MyWorkItem = {
  id: string
  code: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'REQUIREMENTS' | 'DEVELOPMENT' | 'TESTING' | 'COMPLETED'
  deadline: string | null
  project: { id: string; name: string }
  team: { id: string; name: string }
  kind: 'ASSIGNED' | 'AVAILABLE'
  returnedFromTesting: boolean
}

export async function getMyWork(userId: string): Promise<MyWorkItem[]> {
  const memberships = await prisma.team_members.findMany({
    where: { user_id: userId },
    select: { team_id: true, role: true },
  })
  const developmentTeams = memberships
    .filter(({ role }) => role === 'DEVELOPER')
    .map(({ team_id }) => team_id)
  const testingTeams = memberships
    .filter(({ role }) => role === 'TESTER')
    .map(({ team_id }) => team_id)
  const ledTeams = (
    await prisma.teams.findMany({
      where: { leader_id: userId },
      select: { id: true },
    })
  ).map(({ id }) => id)
  const developmentAccess = [...new Set([...developmentTeams, ...ledTeams])]
  const testingAccess = [...new Set([...testingTeams, ...ledTeams])]

  const availability = []
  if (developmentAccess.length) {
    availability.push({
      status: 'REQUIREMENTS' as const,
      assigned_user_id: null,
      projects: { team_id: { in: developmentAccess } },
    })
    availability.push({
      status: 'DEVELOPMENT' as const,
      assigned_user_id: null,
      projects: { team_id: { in: developmentAccess } },
    })
  }
  if (testingAccess.length)
    availability.push({
      status: 'TESTING' as const,
      assigned_user_id: null,
      projects: { team_id: { in: testingAccess } },
    })

  const requirements = await prisma.requirements.findMany({
    where: {
      status: { not: 'COMPLETED' },
      OR: [{ assigned_user_id: userId }, ...availability],
    },
    select: {
      id: true,
      code: true,
      title: true,
      priority: true,
      status: true,
      deadline: true,
      assigned_user_id: true,
      projects: {
        select: {
          id: true,
          name: true,
          teams: { select: { id: true, name: true } },
        },
      },
      requirement_history: {
        where: { from_status: 'TESTING', to_status: 'DEVELOPMENT' },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: [
      { deadline: { sort: 'asc', nulls: 'last' } },
      { priority: 'desc' },
    ],
  })

  return requirements.map((requirement) => ({
    id: requirement.id,
    code: requirement.code,
    title: requirement.title,
    priority: requirement.priority,
    status: requirement.status,
    deadline: requirement.deadline?.toISOString() ?? null,
    project: { id: requirement.projects.id, name: requirement.projects.name },
    team: requirement.projects.teams,
    kind: requirement.assigned_user_id === userId ? 'ASSIGNED' : 'AVAILABLE',
    returnedFromTesting: requirement.requirement_history.length > 0,
  }))
}
