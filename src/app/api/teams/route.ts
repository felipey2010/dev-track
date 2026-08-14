import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireActiveUser } from '@/server/authorization/session'
export async function GET() {
  try {
    const user = await requireActiveUser()
    const rows = await prisma.teams.findMany({
      where:
        user.system_role === 'ADMIN'
          ? undefined
          : {
              OR: [
                { leader_id: user.id },
                { team_members: { some: { user_id: user.id } } },
              ],
            },
      include: {
        users: { select: { id: true, name: true, status: true } },
        team_members: { select: { role: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { name: 'asc' },
    })
    return apiSuccess(
      'Equipes carregadas.',
      rows.map(({ team_members, ...t }) => ({
        ...t,
        canManage: t.leader_id === user.id,
        developerCount: team_members.filter((m) => m.role === 'DEVELOPER')
          .length,
        testerCount: team_members.filter((m) => m.role === 'TESTER').length,
      }))
    )
  } catch (error) {
    return apiError(error, 'Não foi possível carregar as equipes.')
  }
}
