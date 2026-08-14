import Sidebar from '@/components/sidebar'
import Topbar from '@/components/topbar'
import { USER_STATUS } from '@/lib/auth/constants'
import { getCurrentUser } from '@/server/authorization/session'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (user.status === USER_STATUS.PENDING) redirect('/account/pending')
  if (user.status === USER_STATUS.SUSPENDED) redirect('/account/suspended')
  if (user.status !== USER_STATUS.ACTIVE) redirect('/login')

  return (
    <div className='grid min-h-screen grid-cols-1 grid-rows-[56px_1fr] bg-background md:grid-cols-[216px_1fr]'>
      <Topbar user={user} />
      <Sidebar user={user} />
      <main className='min-w-0 px-4 py-8 md:col-start-2 md:px-8 lg:px-12'>
        {children}
      </main>
    </div>
  )
}
