'use client'
import { use, useState } from 'react'
import { PageHeader, Progress, StatusBadge } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  dateLabel,
  projectStatusLabel,
  requirementStatusLabel,
} from '@/lib/format'
import type { ProjectDetail } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { Pagination } from '@/components/ui/pagination'

const REQUIREMENTS_PAGE_SIZE = 10

const types: Record<string, string> = {
  FUNCTIONAL: 'Funcional',
  NON_FUNCTIONAL: 'Não funcional',
}

const priorities: Record<string, string> = {
  LOW: 'BAIXA',
  MEDIUM: 'MÉDIA',
  HIGH: 'ALTA',
  CRITICAL: 'CRÍTICA',
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [requirementsPage, setRequirementsPage] = useState(1)
  const { data, error, isLoading } = useApi<ProjectDetail>(
    `project-${id}`,
    `/api/projects/${id}`
  )
  if (isLoading) return <Skeleton className='h-72 w-full' />

  if (error)
    return (
      <Card>
        <CardContent className='p-8 text-sm text-destructive'>
          {error.message}
        </CardContent>
      </Card>
    )

  if (!data) return null
  const requirementPages = Math.max(
    1,
    Math.ceil(data.requirements.length / REQUIREMENTS_PAGE_SIZE)
  )
  const visibleRequirements = data.requirements.slice(
    (requirementsPage - 1) * REQUIREMENTS_PAGE_SIZE,
    requirementsPage * REQUIREMENTS_PAGE_SIZE
  )

  return (
    <div className='mx-auto max-w-7xl'>
      <p className='mb-3 font-mono text-[10px] text-muted-foreground'>
        Projetos / {data.name}
      </p>
      <PageHeader
        title={data.name}
        description={data.client ?? 'Sem cliente informado'}
      />
      <section className='mb-6 grid overflow-hidden rounded-md border bg-card sm:grid-cols-2 lg:grid-cols-4'>
        <Summary label='Equipe responsável'>
          <strong>{data.team.name}</strong>
        </Summary>
        <Summary label='Gestor atual'>
          <strong>{data.team.leader?.name ?? 'Não definido'}</strong>
          <span>Derivado da liderança da equipe</span>
        </Summary>
        <Summary label='Status do projeto'>
          <StatusBadge value={projectStatusLabel(data.status)} />
        </Summary>
        <Summary label='Progresso calculado'>
          <Progress value={data.progress} />
          <span>Requisitos concluídos / total</span>
        </Summary>
      </section>
      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b py-4'>
          <CardTitle className='text-sm'>
            Requisitos{' '}
            <span className='ml-2 font-normal text-muted-foreground'>
              Requisitos → Desenvolvimento → Testes → Concluído
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {!data.requirements.length ? (
            <div className='p-8 text-sm text-muted-foreground'>
              Nenhum requisito cadastrado neste projeto.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código / requisito</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável atual</TableHead>
                    <TableHead>Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRequirements.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className='font-semibold'>
                        {r.code}
                        <span className='mt-1 block text-[10px] font-normal text-muted-foreground'>
                          {r.title}
                        </span>
                      </TableCell>
                      <TableCell>{types[r.type] ?? r.type}</TableCell>
                      <TableCell>
                        <span className='font-mono text-[10px]'>
                          {priorities[r.priority] ?? r.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={requirementStatusLabel(r.status)} />
                      </TableCell>
                      <TableCell>
                        {r.users_requirements_assigned_user_idTousers?.name ?? (
                          <span className='text-muted-foreground'>
                            Disponível
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='font-mono text-[10px]'>
                        {dateLabel(r.deadline)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={requirementsPage}
                totalPages={requirementPages}
                onPageChange={setRequirementsPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Summary({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-24 flex-col gap-2 border-b p-5 last:border-0 sm:border-r lg:border-b-0'>
      <span className='text-[9px] uppercase tracking-wider text-muted-foreground'>
        {label}
      </span>
      <div className='text-sm'>{children}</div>
    </div>
  )
}
