import { TeamNotFound } from '@/components/feedback/entity-not-found'
import GoBack from '@/components/go-back-button'
import { TeamDetailsContent } from '@/components/teams/team-details-content'
import { getTeam } from '@/lib/services/teams'
import { identifierSchema } from '@/lib/validation/common'
import { requireActiveUser } from '@/server/authorization/session'
import { ApplicationError } from '@/server/errors/application-error'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detalhes da equipe',
  description: 'Consulte integrantes e projetos vinculados à equipe.',
}

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const actor = await requireActiveUser()
  const parsedId = identifierSchema.safeParse((await params).id)
  if (!parsedId.success) return <TeamNotFound />

  let team
  try {
    team = await getTeam(parsedId.data, actor)
  } catch (error) {
    if (error instanceof ApplicationError && error.status === 404)
      return <TeamNotFound />
    throw error
  }

  return (
    <div className='mx-auto max-w-7xl'>
      <GoBack page={`Equipes / ${team.name}`} />
      <TeamDetailsContent team={team} />
    </div>
  )
}
