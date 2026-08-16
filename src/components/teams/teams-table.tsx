'use client'

import { PageHeader } from '@/components/ui'
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
import type { PaginatedData } from '@/lib/pagination'
import type { Team } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DeleteTeamDialog } from './delete-team-dialog'
import { TeamFormDialog } from './team-form-dialog'

export function TeamsTable({ isAdmin }: { isAdmin: boolean }) {
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [deleting, setDeleting] = useState<Team | null>(null)
  const { data, error, isLoading } = useApi<PaginatedData<Team>>(
    'teams',
    `/api/teams?page=${page}`
  )
  const teams = data?.items

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
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
      <Card className='gap-0 overflow-hidden py-0'>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='p-5'>
              <Skeleton className='h-24' />
            </div>
          ) : error ? (
            <State text={error.message} error />
          ) : !teams?.length ? (
            <State text='Nenhuma equipe cadastrada.' />
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
                      {team.name}
                      {team.description && (
                        <span className='mt-1 block text-[10px] font-normal text-muted-foreground'>
                          {team.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {team.users?.name ?? 'Liderança não definida'}
                    </TableCell>
                    <TableCell>{team.developerCount}</TableCell>
                    <TableCell>{team.testerCount}</TableCell>
                    <TableCell>{team._count.projects}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className='flex justify-end gap-1'>
                          <Button
                            size='icon-sm'
                            variant='ghost'
                            aria-label={`Editar ${team.name}`}
                            onClick={() => setEditing(team)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size='icon-sm'
                            variant='ghost'
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

function State({ text, error }: { text: string; error?: boolean }) {
  return (
    <div
      className={`p-8 text-sm ${error ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {text}
    </div>
  )
}
