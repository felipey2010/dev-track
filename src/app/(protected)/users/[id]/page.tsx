import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { identifierSchema } from '@/lib/validation/common'
import { requireActiveUser } from '@/server/authorization/session'
import { FolderKanban, Mail, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
  if (!parsedId.success) notFound()
  const user = await getUserProfile(parsedId.data)
  if (!user) notFound()

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className='mx-auto max-w-7xl flex flex-col gap-6'>
      <div className='mb-2'>
        <Link href='/users'>
          <Button>Voltar</Button>
        </Link>
      </div>
      <p className='font-mono text-[10px] text-muted-foreground'>
        Usuários / {user.name}
      </p>
      <Card>
        <CardContent className='flex flex-col gap-5 sm:flex-row sm:items-center'>
          <Avatar className='size-24'>
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className='bg-cyan-500/10 text-2xl text-cyan-600'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <div className='mb-2 flex flex-wrap items-center gap-2'>
              <h1 className='font-heading text-3xl font-semibold'>
                {user.name}
              </h1>
              <Badge
                variant={
                  user.status === USER_STATUS.ACTIVE ? 'secondary' : 'outline'
                }
              >
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

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='size-4' />
              Equipes
            </CardTitle>
            <CardDescription>
              Equipes das quais o usuário participa atualmente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user.teams.length ? (
              <EmptyState>Nenhuma equipe vinculada.</EmptyState>
            ) : (
              <div className='divide-y rounded-lg border'>
                {user.teams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className='flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted'
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

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FolderKanban className='size-4' />
              Projetos
            </CardTitle>
            <CardDescription>
              Projetos atribuídos às equipes do usuário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user.projects.length ? (
              <EmptyState>Nenhum projeto vinculado.</EmptyState>
            ) : (
              <div className='divide-y rounded-lg border'>
                {user.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className='flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted'
                  >
                    <span className='font-medium'>{project.name}</span>
                    <Badge variant='outline' className='text-[9px]'>
                      {projectStatusLabel(project.status)}
                    </Badge>
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
