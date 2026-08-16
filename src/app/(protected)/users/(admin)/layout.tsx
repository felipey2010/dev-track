import { requireAdmin } from '@/server/authorization/session'

export default async function UsersAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return children
}
