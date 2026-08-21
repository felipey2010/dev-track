'use client'

import { ListFilter } from '@/components/list-filter'
import { ListSearch } from '@/components/list-search'
import { Metric, MetricStrip } from '@/components/metric-strip'
import { PageHeader, ProjectLink, StatusBadge } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dateLabel, projectStatusLabel } from '@/lib/format'
import type { TeamDetail } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'

const PAGE_SIZE = 6
const roleLabels = { DEVELOPER: 'Desenvolvedor', TESTER: 'Testador' } as const

type TeamDetailsData = Omit<TeamDetail, 'projects'> & {
  projects: Array<
    Omit<
      TeamDetail['projects'][number],
      'start_date' | 'expected_completion_date' | 'updated_at'
    > & {
      start_date: string | Date
      expected_completion_date: string | Date | null
      updated_at: string | Date
    }
  >
}

export function TeamDetailsContent({ team }: { team: TeamDetailsData }) {
  const [projectSearch, setProjectSearch] = useState('')
  const [projectStatus, setProjectStatus] = useState('ALL')
  const [projectPage, setProjectPage] = useState(1)
  const [memberPage, setMemberPage] = useState(1)
  const deferredSearch = useDeferredValue(projectSearch.trim())
  const developers = team.team_members.filter(
    (member) => member.role === 'DEVELOPER'
  ).length
  const testers = team.team_members.length - developers
  const filteredProjects = useMemo(() => {
    const term = normalizeSearch(deferredSearch)
    return team.projects.filter(
      (project) =>
        (!term ||
          normalizeSearch(`${project.name} ${project.client ?? ''}`).includes(
            term
          )) &&
        (projectStatus === 'ALL' || project.status === projectStatus)
    )
  }, [deferredSearch, projectStatus, team.projects])
  const projectPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / PAGE_SIZE)
  )
  const visibleProjects = filteredProjects.slice(
    (projectPage - 1) * PAGE_SIZE,
    projectPage * PAGE_SIZE
  )
  const memberPages = Math.max(
    1,
    Math.ceil(team.team_members.length / PAGE_SIZE)
  )
  const visibleMembers = team.team_members.slice(
    (memberPage - 1) * PAGE_SIZE,
    memberPage * PAGE_SIZE
  )

  return (
    <>
      <PageHeader
        title={team.name}
        description={team.description ?? 'Sem descrição informada.'}
      />
      <MetricStrip>
        <Metric
          label='Liderança'
          value={
            team.users ? (
              <Link
                href={`/users/${team.users.id}`}
                className='hover:text-primary hover:underline text-lg'
              >
                {team.users.name}
              </Link>
            ) : (
              'Não definida'
            )
          }
          note={team.users?.email ?? 'Equipe aguardando liderança'}
          tone={team.users ? 'primary' : 'amber'}
          truncateNote
        />
        <Metric
          label='Desenvolvedores'
          value={developers}
          note='Membros em desenvolvimento'
        />
        <Metric
          label='Testadores'
          value={testers}
          note='Membros responsáveis por testes'
        />
        <Metric
          label='Projetos'
          value={team.projects.length}
          note='Projetos vinculados à equipe'
        />
      </MetricStrip>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]'>
        <div className='min-w-0'>
          <div className='mb-4 grid gap-3 md:grid-cols-[minmax(14rem,1fr)_13rem]'>
            <ListSearch
              value={projectSearch}
              onChange={(value) => {
                setProjectSearch(value)
                setProjectPage(1)
              }}
              placeholder='Buscar por projeto ou cliente...'
              label='Buscar projetos da equipe'
            />
            <ListFilter
              label='Status do projeto'
              value={projectStatus}
              onChange={(value) => {
                setProjectStatus(value)
                setProjectPage(1)
              }}
            >
              <option value='ALL'>Todos os status</option>
              <option value='PLANNING'>Planejamento</option>
              <option value='IN_DEVELOPMENT'>Em desenvolvimento</option>
              <option value='TESTING'>Em teste</option>
              <option value='COMPLETED'>Concluído</option>
              <option value='ON_HOLD'>Em espera</option>
              <option value='CANCELLED'>Cancelado</option>
            </ListFilter>
          </div>
          <Card className='h-fit gap-0 overflow-hidden py-0'>
            <CardHeader className='border-b px-5 py-4'>
              <CardTitle>Projetos</CardTitle>
              <p className='text-xs text-muted-foreground'>
                {filteredProjects.length} encontrados
              </p>
            </CardHeader>
            <CardContent className='p-0'>
              {!visibleProjects.length ? (
                <EmptyState>
                  {team.projects.length
                    ? 'Nenhum projeto corresponde aos filtros selecionados.'
                    : 'Nenhum projeto vinculado a esta equipe.'}
                </EmptyState>
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
                    {visibleProjects.map((project) => (
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
              <Pagination
                page={projectPage}
                totalPages={projectPages}
                onPageChange={setProjectPage}
              />
            </CardContent>
          </Card>
        </div>

        <Card className='h-fit gap-0 overflow-hidden py-0'>
          <CardHeader className='border-b px-5 py-4'>
            <CardTitle>Membros</CardTitle>
            <p className='text-xs text-muted-foreground'>
              {team.team_members.length} no total
            </p>
          </CardHeader>
          <CardContent className='p-0'>
            {!visibleMembers.length ? (
              <EmptyState>Nenhum membro cadastrado.</EmptyState>
            ) : (
              <div className='divide-y'>
                {visibleMembers.map((member) => (
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
                      <AvatarFallback>
                        {getInitials(member.users.name)}
                      </AvatarFallback>
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
                ))}
              </div>
            )}
            <Pagination
              page={memberPage}
              totalPages={memberPages}
              onPageChange={setMemberPage}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className='p-8 text-sm text-muted-foreground'>{children}</p>
}
function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}
