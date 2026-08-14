'use client'
import { PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
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
import type { Team } from '@/lib/types'
import { useApi } from '@/lib/use-api'
export default function TeamsPage() {
  const { data, error, isLoading } = useApi<Team[]>('teams', '/api/teams')
  return (
    <div className='mx-auto max-w-[1280px]'>
      <PageHeader
        title='Equipes'
        description='Liderança, membros e projetos sob responsabilidade.'
        action={<Button size='sm'>Nova equipe</Button>}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className='font-semibold'>
                      {t.name}
                      <span className='mt-1 block text-[10px] font-normal text-muted-foreground'>
                        {t.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t.users?.name ?? 'Liderança não definida'}
                    </TableCell>
                    <TableCell>{t.developerCount}</TableCell>
                    <TableCell>{t.testerCount}</TableCell>
                    <TableCell>{t._count.projects}</TableCell>
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
