import GoBack from '@/components/go-back-button'
import { TeamNotFound } from '@/components/feedback/entity-not-found'
import { PageHeader, ProjectLink, StatusBadge } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dateLabel, projectStatusLabel } from '@/lib/format'
import { getTeam } from '@/lib/services/teams'
import { identifierSchema } from '@/lib/validation/common'
import { requireActiveUser } from '@/server/authorization/session'
import { ApplicationError } from '@/server/errors/application-error'
import { FolderKanban, UserRoundCheck, Users } from 'lucide-react'
import Link from 'next/link'

const roleLabels = {
  DEVELOPER: 'Desenvolvedor',
  TESTER: 'Testador',
} as const

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const actor = await requireActiveUser()
  const parsedId = identifierSchema.safeParse((await params).id)
  if (!parsedId.success) return <TeamNotFound />

  let team
  try {
    team = await getTeam(parsedId.data, actor)
  } catch (error) {
    if (error instanceof ApplicationError && error.status === 404)
      return <TeamNotFound />
    throw error
  }

  const developers = team.team_members.filter(
    (member) => member.role === 'DEVELOPER'
  ).length
  const testers = team.team_members.length - developers

  return (
    <div className='mx-auto max-w-7xl'>
      <GoBack />
      <p className='mb-3 font-mono text-[10px] text-muted-foreground'>
        Equipes / {team.name}
      </p>
      <PageHeader
        title={team.name}
        description={team.description ?? 'Sem descrição informada.'}
      />

      <section className='mb-6 grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 lg:grid-cols-4'>
        <Summary icon={<UserRoundCheck />} label='Liderança'>
          {team.users ? (
            <Link
              href={`/users/${team.users.id}`}
              className='font-semibold hover:text-cyan-600 dark:hover:text-cyan-400'
            >
              {team.users.name}
            </Link>
          ) : (
            <span className='text-muted-foreground'>Não definida</span>
          )}
        </Summary>
        <Summary icon={<Users />} label='Desenvolvedores'>
          <strong>{developers}</strong>
        </Summary>
        <Summary icon={<Users />} label='Testadores'>
          <strong>{testers}</strong>
        </Summary>
        <Summary icon={<FolderKanban />} label='Projetos'>
          <strong>{team.projects.length}</strong>
        </Summary>
      </section>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]'>
        <Card className='gap-0 overflow-hidden py-0'>
          <CardHeader className='border-b py-4'>
            <CardTitle>Projetos</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {!team.projects.length ? (
              <EmptyState>Nenhum projeto vinculado a esta equipe.</EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Conclusão prevista</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <ProjectLink id={project.id}>
                          {project.name}
                        </ProjectLink>
                        <span className='mt-1 block text-[10px] text-muted-foreground'>
                          {project.client ?? 'Sem cliente'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          value={projectStatusLabel(project.status)}
                        />
                      </TableCell>
                      <TableCell className='font-mono text-[10px]'>
                        {dateLabel(project.start_date)}
                      </TableCell>
                      <TableCell className='font-mono text-[10px]'>
                        {dateLabel(project.expected_completion_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className='gap-0 overflow-hidden py-0'>
          <CardHeader className='border-b py-4'>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {!team.team_members.length ? (
              <EmptyState>Nenhum membro cadastrado.</EmptyState>
            ) : (
              <div className='divide-y'>
                {team.team_members.map((member) => {
                  const initials = member.users.name
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()
                  return (
                    <Link
                      key={member.id}
                      href={`/users/${member.users.id}`}
                      className='flex items-center gap-3 p-4 transition-colors hover:bg-muted'
                    >
                      <Avatar>
                        {member.users.image && (
                          <AvatarImage
                            src={member.users.image}
                            alt={member.users.name}
                          />
                        )}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium'>
                          {member.users.name}
                        </p>
                        <p className='truncate text-xs text-muted-foreground'>
                          {member.users.email}
                        </p>
                      </div>
                      <Badge variant='outline'>{roleLabels[member.role]}</Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Summary({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-24 items-center gap-3 border-b p-5 last:border-0 sm:border-r lg:border-b-0'>
      <span className='text-muted-foreground [&>svg]:size-5'>{icon}</span>
      <div>
        <span className='block text-[9px] uppercase tracking-wider text-muted-foreground'>
          {label}
        </span>
        <div className='mt-1 text-sm'>{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className='p-8 text-sm text-muted-foreground'>{children}</p>
}
