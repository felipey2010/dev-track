import { TeamsTable } from '@/components/teams/teams-table'
import { requireActiveUser } from '@/server/authorization/session'

export default async function TeamsPage() {
  const user = await requireActiveUser()
  return <TeamsTable isAdmin={user.system_role === 'ADMIN'} />
}
