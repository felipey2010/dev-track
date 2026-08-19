import { auth } from '@/auth'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Início',
  robots: { index: false, follow: false },
}

export default async function Home() {
  const session = await auth()
  redirect(session?.user ? '/dashboard' : '/login')
}
