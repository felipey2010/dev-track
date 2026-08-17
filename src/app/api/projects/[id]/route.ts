import { apiError, apiSuccess } from '@/lib/http'
import { projectFormSchema } from '@/lib/projects/validation'
import {
  deleteProject,
  getProject,
  updateProject,
} from '@/lib/services/projects'
import { identifierSchema } from '@/lib/validation/common'
import {
  requireProjectAccess,
  requireProjectManager,
} from '@/server/authorization/session'

async function projectId(context: { params: Promise<{ id: string }> }) {
  const parsed = identifierSchema.safeParse((await context.params).id)
  return parsed.success ? parsed.data : null
}

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await projectId(context)
    if (!id)
      return Response.json(
        { success: false, message: 'Projeto não encontrado.', data: null },
        { status: 404 }
      )
    const actor = await requireProjectAccess(id)
    return apiSuccess('Projeto carregado.', await getProject(id, actor))
  } catch (error) {
    return apiError(error, 'Não foi possível carregar o projeto.')
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await projectId(context)
    if (!id)
      return Response.json(
        { success: false, message: 'Projeto não encontrado.', data: null },
        { status: 404 }
      )
    const actor = await requireProjectManager(id)
    const parsed = projectFormSchema.safeParse(await request.json())
    if (!parsed.success)
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          data: null,
        },
        { status: 422 }
      )
    return apiSuccess(
      'Projeto atualizado com sucesso.',
      await updateProject(id, parsed.data, actor)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar o projeto.')
  }
}

export const PATCH = PUT

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await projectId(context)
    if (!id)
      return Response.json(
        { success: false, message: 'Projeto não encontrado.', data: null },
        { status: 404 }
      )
    const actor = await requireProjectManager(id)
    return apiSuccess(
      'Projeto excluído com sucesso.',
      await deleteProject(id, actor)
    )
  } catch (error) {
    return apiError(error, 'Não foi possível excluir o projeto.')
  }
}
