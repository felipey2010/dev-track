'use client'
import { Loading, State } from '@/components/content-states'
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
import { useState } from 'react'
import Link from 'next/link'

const labels: Record<string, string> = {
  ACTIVE: 'ATIVO',
  PENDING: 'PENDENTE',
  SUSPENDED: 'SUSPENSO',
  REJECTED: 'REJEITADO',
}

export default function UsersPage() {
  const [page, setPage] = useState(DEFAULT_PAGE)
  const { data, error, isLoading } = useApi<PaginatedData<User>>(
    'users',
    `/api/users?page=${page}`
  )
  const users = data?.items

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Usuários'
        description='Aprovação e controle de acesso à plataforma.'
      />
      <Card className='gap-0 overflow-hidden py-0'>
        <CardContent className='p-0'>
          {isLoading ? (
            <Loading />
          ) : error ? (
            <State text={error.message} error />
          ) : !users?.length ? (
            <State text='Nenhum outro usuário cadastrado.' />
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
                        className='font-semibold text-foreground transition-colors hover:text-cyan-600 dark:hover:text-cyan-400'
                      >
                        {u.name}
                      </Link>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className='font-mono text-[10px]'>
                      {u.system_role}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className='text-[10px]'>
                        {labels[u.status] ?? u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserStatusActions id={u.id} status={u.status} />
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
