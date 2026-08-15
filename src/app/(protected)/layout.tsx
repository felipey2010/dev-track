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
    <div className='grid h-dvh grid-cols-1 grid-rows-[56px_minmax(0,1fr)] overflow-hidden bg-background md:grid-cols-[216px_minmax(0,1fr)]'>
      <Topbar />
      <Sidebar user={user} />
      <main className='min-h-0 min-w-0 overflow-y-auto overscroll-contain px-4 py-8 pb-24 md:col-start-2 md:px-8 md:pb-8 lg:px-12'>
        {children}
      </main>
    </div>
  )
}
