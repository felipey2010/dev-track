import { TeamsTable } from '@/components/teams/teams-table'
import { requireActiveUser } from '@/server/authorization/session'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Equipes',
  description: 'Consulte equipes, integrantes e responsabilidades.',
}

export default async function TeamsPage() {
  const user = await requireActiveUser()
  return <TeamsTable isAdmin={user.system_role === 'ADMIN'} />
}
