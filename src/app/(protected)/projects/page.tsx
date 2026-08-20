'use client'
import { Loading, State } from '@/components/content-states'
import { ListSearch } from '@/components/list-search'
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
import type { Project } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { useDeferredValue, useState } from 'react'

export default function ProjectsPage() {
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const searchParameters = new URLSearchParams({ page: String(page) })
  if (deferredSearch) searchParameters.set('search', deferredSearch)
  const { data, error, isLoading } = useApi<PaginatedData<Project>>(
    'projects',
    `/api/projects?${searchParameters}`
  )
  const projects = data?.items

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        eyebrow='Portfólio'
        title='Projetos'
        description='Status gerencial e evolução real dos requisitos.'
        action={<CreateProjectDialog />}
      />
      <Card className='gap-0 overflow-hidden py-0'>
        <div className='border-b p-4'>
          <ListSearch
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(DEFAULT_PAGE)
            }}
            placeholder='Buscar por projeto, cliente ou equipe...'
            label='Buscar projetos'
          />
        </div>
        <CardContent className='p-0'>
          {isLoading ? (
            <Loading />
          ) : error ? (
            <State text={error.message} error />
          ) : !projects?.length ? (
            <State
              text={
                deferredSearch
                  ? 'Nenhum projeto encontrado para esta busca.'
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
                      {p.team.name}
                      <span className='mt-1 block text-[10px] text-muted-foreground'>
                        {p.team.leader?.name ?? 'Sem liderança'}
                      </span>
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
