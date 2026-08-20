'use client'
import {
  BriefcaseBusiness,
  FolderKanban,
  LayoutDashboard,
  UserCog,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import SidebarItem from './sidebar-item'
import { USER_ROLE } from '@/lib/auth/constants'
import { ACCOUNT_ROLE } from '@/types/next-auth'

const primary = [
  ['/dashboard', 'Painel', LayoutDashboard],
  ['/my-work', 'Meu trabalho', BriefcaseBusiness],
  ['/projects', 'Projetos', FolderKanban],
  ['/teams', 'Equipes', Users],
] as const
const admin = [['/users', 'Usuários', UserCog]] as const
type CurrentUser = {
  id: string
  name: string
  email: string
  system_role: ACCOUNT_ROLE
}
export default function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname()
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const mobileItems =
    user.system_role === USER_ROLE.ADMIN ? [...primary, ...admin] : primary

  return (
    <>
      <aside className='hidden min-h-0 flex-col justify-between overflow-hidden border-r bg-card md:flex'>
        <div className='px-2 py-7'>
          <NavGroup label='Geral' items={primary} />
          {user.system_role === 'ADMIN' && (
            <NavGroup label='Administração' items={admin} />
          )}
        </div>
        <div className='border-t p-4'>
          <Link
            href={`/users/${user.id}`}
            className='p-1 flex items-center gap-2.5 rounded-lg outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring'
            aria-label={`Abrir perfil de ${user.name}`}
          >
            <Avatar className='size-10'>
              <AvatarFallback className='bg-cyan-500/10 text-[10px] text-cyan-600'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <strong className='block truncate text-[11px]'>
                {user.name}
              </strong>
              <span className='block truncate font-mono text-[9px] text-muted-foreground'>
                {user.email}
              </span>
              <span className='block truncate font-mono text-[9px] text-muted-foreground'>
                {user.system_role === 'ADMIN' ? 'Administrador' : 'Usuário'}
              </span>
            </div>
          </Link>
          <div className='mt-4 flex gap-3 text-[9px] text-muted-foreground'>
            <Link href='/privacy'>Privacidade</Link>
            <Link href='/terms'>Termos</Link>
          </div>
        </div>
      </aside>
      <nav className='fixed inset-x-0 bottom-0 z-50 grid h-16 grid-flow-col auto-cols-fr border-t bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden'>
        {mobileItems.map(([route, title, Icon]) => {
          const active =
            pathname === route ||
            (route !== '/dashboard' && pathname.startsWith(`${route}/`))
          return (
            <Link
              key={route}
              href={route}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground'}`}
            >
              <Icon className='size-4' />
              <span className='truncate'>{title}</span>
            </Link>
          )
        })}
      </nav>
    </>
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
      <nav className='flex flex-col gap-1'>
        {items.map(([route, title, icon]) => (
          <SidebarItem key={route} item={{ route, title, icon }} />
        ))}
      </nav>
    </div>
  )
}
