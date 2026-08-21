'use client'
import { Loading, State } from '@/components/content-states'
import { ListFilter } from '@/components/list-filter'
import { ListSearch } from '@/components/list-search'
import { Metric, MetricStrip } from '@/components/metric-strip'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { PageHeader, Progress, ProjectLink, StatusBadge } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/card'
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
import { DEFAULT_PAGE, type PaginatedData } from '@/lib/pagination'
import { PROJECT_STATUS } from '@/lib/projects/constants'
import type { Project } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { getInitials } from '@/lib/utils'
import { useDeferredValue, useState } from 'react'

export default function ProjectsPage() {
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [teamId, setTeamId] = useState('ALL')
  const deferredSearch = useDeferredValue(search.trim())
  const searchParameters = new URLSearchParams({ page: String(page) })
  if (deferredSearch) searchParameters.set('search', deferredSearch)
  if (status !== 'ALL') searchParameters.set('status', status)
  if (teamId !== 'ALL') searchParameters.set('teamId', teamId)
  const { data, error, isLoading } = useApi<PaginatedData<Project>>(
    'projects',
    `/api/projects?${searchParameters}`
  )
  const projects = data?.items
  const summary = useApi<Project[]>('projects', '/api/projects')
  const allProjects = summary.data ?? []
  const development = allProjects.filter(
    (project) => project.status === PROJECT_STATUS.IN_DEVELOPMENT
  )
  const planning = allProjects.filter(
    (project) => project.status === 'PLANNING'
  )
  const averageProgress = allProjects.length
    ? Math.round(
        allProjects.reduce((total, project) => total + project.progress, 0) /
          allProjects.length
      )
    : 0
  const teams = Array.from(
    new Map(
      allProjects.map((project) => [project.team.id, project.team])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        eyebrow='Portfólio'
        title='Projetos'
        description='Status gerencial e evolução real dos requisitos.'
        action={<CreateProjectDialog />}
      />
      <MetricStrip>
        <Metric
          label='Total de projetos'
          value={allProjects.length}
          note={`${teams.length} ${teams.length === 1 ? 'equipe cadastrada' : 'equipes cadastradas'}`}
        />
        <Metric
          label='Em desenvolvimento'
          value={development.length}
          note={development[0]?.name ?? 'Nenhum projeto nesta etapa'}
          tone='primary'
          truncateNote
        />
        <Metric
          label='Em planejamento'
          value={planning.length}
          note={
            planning.length
              ? planning
                  .map((project) => project.name)
                  .slice(0, 2)
                  .join(' · ')
              : 'Nenhum projeto nesta etapa'
          }
          truncateNote
        />
        <Metric
          label='Progresso médio'
          value={`${averageProgress}%`}
          note={`Nos ${allProjects.length} projetos acessíveis`}
        />
      </MetricStrip>
      <div className='mb-5 grid gap-3 md:grid-cols-[minmax(16rem,1fr)_13rem_13rem]'>
        <ListSearch
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(DEFAULT_PAGE)
          }}
          placeholder='Buscar por projeto, cliente ou equipe...'
          label='Buscar projetos'
        />
        <ListFilter
          label='Status do projeto'
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(DEFAULT_PAGE)
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
        <ListFilter
          label='Equipe'
          value={teamId}
          onChange={(value) => {
            setTeamId(value)
            setPage(DEFAULT_PAGE)
          }}
        >
          <option value='ALL'>Todas as equipes</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </ListFilter>
      </div>
      <Card className='gap-0 overflow-hidden py-0'>
        <CardContent className='p-0'>
          {isLoading ? (
            <Loading />
          ) : error ? (
            <State text={error.message} error />
          ) : !projects?.length ? (
            <State
              text={
                deferredSearch || status !== 'ALL' || teamId !== 'ALL'
                  ? 'Nenhum projeto corresponde aos filtros selecionados.'
                  : 'Nenhum projeto cadastrado.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Equipe / gestor atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Conclusão prevista</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <ProjectLink id={p.id}>{p.name}</ProjectLink>
                      <span className='mt-1 block text-[10px] text-muted-foreground'>
                        {p.client ?? 'Sem cliente'}
                      </span>
                    </TableCell>
                    <TableCell className='text-xs'>
                      <div className='flex items-center gap-2.5'>
                        <span className='grid size-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-accent text-[10px] font-bold text-primary'>
                          {getInitials(p.team.leader?.name ?? p.team.name)}
                        </span>
                        <span>
                          <span className='block font-medium text-foreground'>
                            {p.team.leader?.name ?? 'Sem liderança'}
                          </span>
                          <span className='mt-0.5 block text-[10px] text-muted-foreground'>
                            {p.team.name}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={projectStatusLabel(p.status)} />
                    </TableCell>
                    <TableCell>
                      <Progress value={p.progress} />
                    </TableCell>
                    <TableCell className='font-mono text-[10px]'>
                      {dateLabel(p.start_date)}
                    </TableCell>
                    <TableCell className='font-mono text-[10px]'>
                      {dateLabel(p.expected_completion_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {data && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
