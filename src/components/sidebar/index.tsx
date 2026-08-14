'use client'
import { FolderKanban, LayoutDashboard, UserCog, Users } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import SidebarItem from './sidebar-item'

const primary = [
  ['/dashboard', 'Painel', LayoutDashboard],
  ['/projects', 'Projetos', FolderKanban],
  ['/teams', 'Equipes', Users],
] as const
const admin = [['/users', 'Usuários', UserCog]] as const
type CurrentUser = {
  name: string
  email: string
  system_role: 'ADMIN' | 'USER'
}
export default function Sidebar({ user }: { user: CurrentUser }) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return (
    <aside className='hidden min-h-[calc(100vh-56px)] flex-col justify-between border-r bg-card md:flex'>
      <div className='px-2 py-7'>
        <NavGroup label='Geral' items={primary} />
        {user.system_role === 'ADMIN' && (
          <NavGroup label='Administração' items={admin} />
        )}
      </div>
      <div className='border-t p-4'>
        <div className='flex items-center gap-2.5'>
          <Avatar className='size-7'>
            <AvatarFallback className='bg-cyan-500/10 text-[10px] text-cyan-600'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <strong className='block truncate text-[11px]'>{user.name}</strong>
            <span className='block truncate font-mono text-[9px] text-muted-foreground'>
              {user.email}
            </span>
          </div>
        </div>
        <div className='mt-4 flex gap-3 text-[9px] text-muted-foreground'>
          <Link href='/privacy'>Privacidade</Link>
          <Link href='/terms'>Termos</Link>
        </div>
      </div>
    </aside>
  )
}
function NavGroup({
  label,
  items,
}: {
  label: string
  items: readonly (readonly [string, string, typeof LayoutDashboard])[]
}) {
  return (
    <div className='mb-7'>
      <p className='mb-2 px-2 font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground'>
        {label}
      </p>
      <nav className='space-y-1'>
        {items.map(([route, title, icon]) => (
          <SidebarItem key={route} item={{ route, title, icon }} />
        ))}
      </nav>
    </div>
  )
}
