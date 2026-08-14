'use client'
import { PageHeader } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { User } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { UserStatusActions } from '@/components/users/user-status-actions'

const labels: Record<string, string> = {
  ACTIVE: 'ATIVO',
  PENDING: 'PENDENTE',
  SUSPENDED: 'SUSPENSO',
  REJECTED: 'REJEITADO',
}

export default function UsersPage() {
  const { data, error, isLoading } = useApi<User[]>('users', '/api/users')

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Usuários'
        description='Aprovação e controle de acesso à plataforma.'
      />
      <Card className='gap-0 overflow-hidden py-0'>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='p-5'>
              <Skeleton className='h-24' />
            </div>
          ) : error ? (
            <State text={error.message} error />
          ) : !data?.length ? (
            <State text='Nenhum usuário cadastrado.' />
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
                {data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className='font-semibold'>{u.name}</TableCell>
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
        </CardContent>
      </Card>
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
