import { apiError } from '@/lib/http'
import {
  generateProjectPdf,
  projectPdfFilename,
} from '@/lib/services/project-pdf'
import { getProject } from '@/lib/services/projects'
import { identifierSchema } from '@/lib/validation/common'
import { requireProjectAccess } from '@/server/authorization/session'

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
    const actor = await requireProjectAccess(parsedId.data)
    const project = await getProject(parsedId.data, actor)
    const pdf = await generateProjectPdf(project)
    const body = new ArrayBuffer(pdf.byteLength)
    new Uint8Array(body).set(pdf)
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${projectPdfFilename(project.name)}"`,
        'Cache-Control': 'private, no-store',
        'Content-Length': String(pdf.byteLength),
      },
    })
  } catch (error) {
    return apiError(error, 'Não foi possível gerar o PDF do projeto.')
  }
}
