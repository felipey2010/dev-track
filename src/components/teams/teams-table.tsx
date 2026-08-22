'use client'

import { PageHeader } from '@/components/ui'
import { ListSearch } from '@/components/list-search'
import { ListFilter } from '@/components/list-filter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DEFAULT_PAGE, type PaginatedData } from '@/lib/pagination'
import type { Team } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import Link from 'next/link'
import { State } from '../content-states'
import { DeleteTeamDialog } from './delete-team-dialog'
import { TeamFormDialog } from './team-form-dialog'

export function TeamsTable({ isAdmin }: { isAdmin: boolean }) {
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [search, setSearch] = useState('')
  const [leadership, setLeadership] = useState('ALL')
  const [projects, setProjects] = useState('ALL')
  const deferredSearch = useDeferredValue(search.trim())
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [deleting, setDeleting] = useState<Team | null>(null)
  const searchParameters = new URLSearchParams({ page: String(page) })
  if (deferredSearch) searchParameters.set('search', deferredSearch)
  if (leadership !== 'ALL') searchParameters.set('leadership', leadership)
  if (projects !== 'ALL') searchParameters.set('projects', projects)
  const { data, error, isLoading } = useApi<PaginatedData<Team>>(
    'teams',
    `/api/teams?${searchParameters}`
  )
  const teams = data?.items

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        eyebrow='Organização'
        title='Equipes'
        description='Liderança, membros e projetos sob responsabilidade.'
        action={
          isAdmin ? (
            <Button
              size='lg'
              className='gap-2'
              onClick={() => setCreating(true)}
            >
              <Plus className='size-4' /> Nova equipe
            </Button>
          ) : undefined
        }
      />
      <div className='mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_13rem_13rem]'>
        <div className='sm:col-span-2 lg:col-span-1'>
          <ListSearch
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(DEFAULT_PAGE)
            }}
            placeholder='Buscar por equipe, descrição ou liderança...'
            label='Buscar equipes'
          />
        </div>
        <ListFilter
          label='Liderança'
          value={leadership}
          onChange={(value) => {
            setLeadership(value)
            setPage(DEFAULT_PAGE)
          }}
        >
          <option value='ALL'>Toda liderança</option>
          <option value='WITH'>Com liderança</option>
          <option value='WITHOUT'>Sem liderança</option>
        </ListFilter>
        <ListFilter
          label='Projetos'
          value={projects}
          onChange={(value) => {
            setProjects(value)
            setPage(DEFAULT_PAGE)
          }}
        >
          <option value='ALL'>Todos os vínculos</option>
          <option value='WITH'>Com projetos</option>
          <option value='WITHOUT'>Sem projetos</option>
        </ListFilter>
      </div>
      <Card className='gap-0 overflow-hidden py-0'>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='p-5'>
              <Skeleton className='h-24' />
            </div>
          ) : error ? (
            <State text={error.message} error />
          ) : !teams?.length ? (
            <State
              text={
                deferredSearch || leadership !== 'ALL' || projects !== 'ALL'
                  ? 'Nenhuma equipe corresponde aos filtros selecionados.'
                  : 'Nenhuma equipe cadastrada.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Líder / gestor dos projetos</TableHead>
                  <TableHead>Desenvolvedores</TableHead>
                  <TableHead>Testadores</TableHead>
                  <TableHead>Projetos</TableHead>
                  {isAdmin && (
                    <TableHead className='w-24 text-right'>Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className='font-semibold'>
                      <Link
                        href={`/teams/${team.id}`}
                        className='transition-colors hover:text-primary'
                      >
                        {team.name}
                      </Link>
                      {team.description && (
                        <span className='mt-1 block text-[10px] font-normal text-muted-foreground'>
                          {team.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {team.users?.name ?? 'Liderança não definida'}
                    </TableCell>
                    <TableCell>
                      <span className='inline-flex min-w-7 justify-center rounded-full border bg-secondary px-2 py-1 text-xs'>
                        {team.developerCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='inline-flex min-w-7 justify-center rounded-full border bg-secondary px-2 py-1 text-xs'>
                        {team.testerCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='inline-flex rounded-full border border-primary/25 bg-accent px-2.5 py-1 text-xs font-semibold text-primary'>
                        {team._count.projects}{' '}
                        {team._count.projects === 1 ? 'projeto' : 'projetos'}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className='flex justify-end gap-1'>
                          <Button
                            size='icon-sm'
                            variant='outline'
                            aria-label={`Editar ${team.name}`}
                            onClick={() => setEditing(team)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size='icon-sm'
                            variant='outline'
                            className='text-destructive'
                            aria-label={`Excluir ${team.name}`}
                            onClick={() => setDeleting(team)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    )}
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
      {isAdmin && (
        <>
          <TeamFormDialog open={creating} onOpenChange={setCreating} />
          <TeamFormDialog
            team={editing}
            open={editing !== null}
            onOpenChange={(open) => !open && setEditing(null)}
          />
          <DeleteTeamDialog
            team={deleting}
            open={deleting !== null}
            onOpenChange={(open) => !open && setDeleting(null)}
          />
        </>
      )}
    </div>
  )
}
