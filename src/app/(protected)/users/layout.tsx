import { redirect } from 'next/navigation'
import { requireAdmin } from '@/server/authorization/session'
export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch {
    redirect('/dashboard')
  }
  return children
}
