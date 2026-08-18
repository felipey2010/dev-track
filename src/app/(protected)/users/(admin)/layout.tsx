import { NotAuthorized } from '@/components/feedback/not-authorized'
import { USER_ROLE } from '@/lib/auth/constants'
import { requireActiveUser } from '@/server/authorization/session'

export default async function UsersAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireActiveUser()
  if (user.system_role !== USER_ROLE.ADMIN) return <NotAuthorized />

  return children
}
