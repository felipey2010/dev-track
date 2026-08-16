import 'server-only'
import { paginated } from '@/lib/pagination'
import { prisma } from '@/lib/prisma'

type Actor = { id: string; system_role: 'ADMIN' | 'USER' }
export async function listActivity(
  actor: Actor,
  pagination: { page: number; pageSize: number; skip: number }
) {
  const projects =
    actor.system_role === 'ADMIN'
      ? undefined
      : await prisma.projects.findMany({
          where: {
            OR: [
              { teams: { leader_id: actor.id } },
              { teams: { team_members: { some: { user_id: actor.id } } } },
            ],
          },
          select: { id: true, requirements: { select: { id: true } } },
        })
  const entityIds = projects?.flatMap((project) => [
    project.id,
    ...project.requirements.map((requirement) => requirement.id),
  ])
  const where = entityIds ? { entity_id: { in: entityIds } } : undefined
  const [items, totalItems] = await prisma.$transaction([
    prisma.audit_logs.findMany({
      select: {
        id: true,
        action: true,
        actor_name_snapshot: true,
        entity_type: true,
        created_at: true,
      },
      where,
      orderBy: { created_at: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.audit_logs.count({ where }),
  ])
  return paginated(items, totalItems, pagination.page, pagination.pageSize)
}
