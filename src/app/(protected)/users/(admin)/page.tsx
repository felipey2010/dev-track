'use client'
import { Loading, State } from '@/components/content-states'
import { ListSearch } from '@/components/list-search'
import { ListFilter } from '@/components/list-filter'
import { PageHeader } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
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
import { UserStatusActions } from '@/components/users/user-status-actions'
import { DEFAULT_PAGE, type PaginatedData } from '@/lib/pagination'
import type { User } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import Link from 'next/link'
import { useDeferredValue, useState } from 'react'

const labels: Record<string, string> = {
  ACTIVE: 'ATIVO',
  PENDING: 'PENDENTE',
  SUSPENDED: 'SUSPENSO',
  REJECTED: 'REJEITADO',
}

export default function UsersPage() {
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const deferredSearch = useDeferredValue(search.trim())
  const searchParameters = new URLSearchParams({ page: String(page) })
  if (deferredSearch) searchParameters.set('search', deferredSearch)
  if (role !== 'ALL') searchParameters.set('role', role)
  if (status !== 'ALL') searchParameters.set('status', status)
  const { data, error, isLoading } = useApi<PaginatedData<User>>(
    'users',
    `/api/users?${searchParameters}`
  )
  const users = data?.items

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        eyebrow='Administração'
        title='Usuários'
        description='Aprovação, papéis e controle de acesso à plataforma.'
      />
      <div className='mb-5 grid gap-3 md:grid-cols-[minmax(16rem,1fr)_13rem_13rem]'>
        <ListSearch
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(DEFAULT_PAGE)
          }}
          placeholder='Buscar por nome ou e-mail...'
          label='Buscar usuários'
        />
        <ListFilter
          label='Papel'
          value={role}
          onChange={(value) => {
            setRole(value)
            setPage(DEFAULT_PAGE)
          }}
        >
          <option value='ALL'>Todos os papéis</option>
          <option value='ADMIN'>Administradores</option>
          <option value='USER'>Usuários</option>
        </ListFilter>
        <ListFilter
          label='Situação'
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(DEFAULT_PAGE)
          }}
        >
          <option value='ALL'>Todas as situações</option>
          <option value='ACTIVE'>Ativos</option>
          <option value='PENDING'>Pendentes</option>
          <option value='SUSPENDED'>Suspensos</option>
          <option value='REJECTED'>Rejeitados</option>
        </ListFilter>
      </div>
      <Card className='gap-0 overflow-hidden py-0'>
        <CardContent className='p-0'>
          {isLoading ? (
            <Loading />
          ) : error ? (
            <State text={error.message} error />
          ) : !users?.length ? (
            <State
              text={
                deferredSearch || role !== 'ALL' || status !== 'ALL'
                  ? 'Nenhum usuário corresponde aos filtros selecionados.'
                  : 'Nenhum outro usuário cadastrado.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Link
                        href={`/users/${u.id}`}
                        className='font-semibold text-foreground transition-colors hover:text-primary'
                      >
                        {u.name}
                      </Link>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant='secondary'
                        className='font-mono text-[10px]'
                      >
                        {u.system_role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={
                          u.status === 'ACTIVE'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-500'
                            : 'text-[10px]'
                        }
                      >
                        <span className='size-1.5 rounded-full bg-current' />
                        {labels[u.status] ?? u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserStatusActions
                        id={u.id}
                        name={u.name}
                        email={u.email}
                        image={u.image}
                        status={u.status}
                        systemRole={u.system_role}
                      />
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
