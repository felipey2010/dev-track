import { apiError, apiSuccess } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { requireProjectAccess } from '@/server/authorization/session'
import { identifierSchema } from '@/lib/validation/common'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parsedId = identifierSchema.safeParse((await params).id)
    if (!parsedId.success)
      return Response.json(
        { success: false, message: 'Projeto não encontrado.', data: null },
        { status: 404 }
      )
    const id = parsedId.data
    await requireProjectAccess(id)
    const row = await prisma.projects.findUnique({
      where: { id },
      include: {
        teams: { include: { users: { select: { id: true, name: true } } } },
        requirements: {
          include: {
            users_requirements_assigned_user_idTousers: {
              select: { id: true, name: true },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    })
    if (!row)
      return Response.json(
        { success: false, message: 'Projeto não encontrado.', data: null },
        { status: 404 }
      )
    const completed = row.requirements.filter(
      (r) => r.status === 'COMPLETED'
    ).length
    return apiSuccess('Projeto carregado.', {
      ...row,
      team: { id: row.teams.id, name: row.teams.name, leader: row.teams.users },
      progress: row.requirements.length
        ? Math.round((completed / row.requirements.length) * 100)
        : 0,
    })
  } catch (error) {
    return apiError(error, 'Não foi possível carregar o projeto.')
  }
}
