import { UserNotFound } from '@/components/feedback/user-not-found'
import GoBack from '@/components/go-back-button'
import { StatusBadge } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { USER_STATUS } from '@/lib/auth/constants'
import { projectStatusLabel } from '@/lib/format'
import { getUserProfile } from '@/lib/services/users'
import { getInitials } from '@/lib/utils'
import { identifierSchema } from '@/lib/validation/common'
import { requireActiveUser } from '@/server/authorization/session'
import { Mail, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Perfil do usuário',
  description: 'Consulte os dados, equipes e projetos do usuário.',
}

const statusLabels = {
  ACTIVE: 'Ativo',
  PENDING: 'Pendente',
  SUSPENDED: 'Suspenso',
  REJECTED: 'Rejeitado',
} as const

const teamRoleLabels = {
  LEADER: 'Liderança',
  DEVELOPER: 'Desenvolvedor',
  TESTER: 'Testador',
} as const

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireActiveUser()
  const parsedId = identifierSchema.safeParse((await params).id)
  if (!parsedId.success) return <UserNotFound />
  const user = await getUserProfile(parsedId.data)
  if (!user) return <UserNotFound />

  const initials = getInitials(user.name)

  return (
    <div className='mx-auto flex max-w-7xl flex-col gap-5'>
      <GoBack />
      <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-primary before:h-px before:w-3.5 before:bg-primary before:content-['']">
        Usuários / {user.name}
      </p>
      <Card className='py-0'>
        <CardContent className='flex flex-col gap-5 p-6 sm:flex-row sm:items-center'>
          <Avatar className='size-18.5 border border-border'>
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className='bg-accent text-xl font-bold text-primary'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <div className='mb-2 flex flex-wrap items-center gap-2'>
              <h1 className='text-[28px] font-bold tracking-[-.02em]'>
                {user.name}
              </h1>
              <Badge
                variant='outline'
                className={
                  user.status === USER_STATUS.ACTIVE
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                    : ''
                }
              >
                <span className='size-1.5 rounded-full bg-current' />{' '}
                {statusLabels[user.status]}
              </Badge>
            </div>
            <div className='flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-5'>
              <span className='flex items-center gap-1.5'>
                <Mail className='size-4' />
                {user.email}
              </span>
              <span className='flex items-center gap-1.5'>
                <ShieldCheck className='size-4' />
                {user.systemRole === 'ADMIN' ? 'Administrador' : 'Usuário'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-5 lg:grid-cols-2'>
        <Card className='h-fit gap-0 py-0'>
          <CardHeader className='border-b p-5'>
            <CardTitle>Equipes</CardTitle>
            <CardDescription>
              Equipes das quais o usuário participa atualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            {!user.teams.length ? (
              <EmptyState>Nenhuma equipe vinculada.</EmptyState>
            ) : (
              <div className='divide-y'>
                {user.teams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className='flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted'
                  >
                    <div className='min-w-0'>
                      <p className='font-medium'>{team.name}</p>
                      {team.description && (
                        <p className='truncate text-xs text-muted-foreground'>
                          {team.description}
                        </p>
                      )}
                    </div>
                    <Badge variant='outline' className='text-[10px]'>
                      {teamRoleLabels[team.role]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='h-fit gap-0 py-0'>
          <CardHeader className='border-b p-5'>
            <CardTitle>Projetos</CardTitle>
            <CardDescription>
              Projetos atribuídos às equipes do usuário.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            {!user.projects.length ? (
              <EmptyState>Nenhum projeto vinculado.</EmptyState>
            ) : (
              <div className='divide-y'>
                {user.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className='flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted'
                  >
                    <span className='font-medium'>{project.name}</span>
                    <StatusBadge value={projectStatusLabel(project.status)} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
      {children}
    </p>
  )
}
