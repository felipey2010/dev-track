'use client'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { PageHeader, Progress, ProjectLink, StatusBadge } from '@/components/ui'
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
import { dateLabel, projectStatusLabel } from '@/lib/format'
import type { Project } from '@/lib/types'
import { useApi } from '@/lib/use-api'

export default function ProjectsPage() {
  const { data, error, isLoading } = useApi<Project[]>(
    'projects',
    '/api/projects'
  )

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        eyebrow='Portfólio'
        title='Projetos'
        description='Status gerencial e evolução real dos requisitos.'
        action={<CreateProjectDialog />}
      />
      <Card className='gap-0 overflow-hidden py-0'>
        <CardContent className='p-0'>
          {isLoading ? (
            <Loading />
          ) : error ? (
            <State text={error.message} error />
          ) : !data?.length ? (
            <State text='Nenhum projeto cadastrado.' />
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
                {data.map((p) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
function Loading() {
  return (
    <div className='flex flex-col gap-2 p-5'>
      <Skeleton className='h-10' />
      <Skeleton className='h-10' />
      <Skeleton className='h-10' />
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
