'use client'
import { ProjectNotFound } from '@/components/feedback/entity-not-found'
import GoBack from '@/components/go-back-button'
import { ListSearch } from '@/components/list-search'
import { ListFilter } from '@/components/list-filter'
import { ProjectFormDialog } from '@/components/projects/create-project-dialog'
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog'
import { DeleteRequirementDialog } from '@/components/requirements/delete-requirement-dialog'
import { RequirementFormDialog } from '@/components/requirements/requirement-form-dialog'
import { PageHeader, Progress, StatusBadge } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ApiClientError } from '@/lib/client-api/http'
import {
  dateLabel,
  projectStatusLabel,
  requirementStatusLabel,
} from '@/lib/format'
import { DEFAULT_PAGE } from '@/lib/pagination'
import type { ProjectDetail, Requirement } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { use, useState } from 'react'

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
  const [requirementsPage, setRequirementsPage] = useState(DEFAULT_PAGE)
  const [requirementsSearch, setRequirementsSearch] = useState('')
  const [requirementsStatus, setRequirementsStatus] = useState('ALL')
  const [requirementsPriority, setRequirementsPriority] = useState('ALL')
  const [creatingRequirement, setCreatingRequirement] = useState(false)
  const [editingRequirement, setEditingRequirement] =
    useState<Requirement | null>(null)
  const [deletingRequirement, setDeletingRequirement] =
    useState<Requirement | null>(null)
  const [editingProject, setEditingProject] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)
  const { data, error, isLoading } = useApi<ProjectDetail>(
    `project-${id}`,
    `/api/projects/${id}`
  )

  if (isLoading) return <Skeleton className='h-72 w-full' />

  if (error instanceof ApiClientError && error.status === 404)
    return <ProjectNotFound />

  if (error)
    return (
      <Card>
        <CardContent className='p-8 text-sm text-destructive'>
          {error.message}
        </CardContent>
      </Card>
    )

  if (!data) return <ProjectNotFound />

  const normalizedRequirementsSearch = requirementsSearch
    .trim()
    .toLocaleLowerCase('pt-BR')
  const filteredRequirements = data.requirements.filter((requirement) => {
    const matchesSearch =
      !normalizedRequirementsSearch ||
      [
        requirement.code,
        requirement.title,
        requirement.description,
        requirement.users_requirements_assigned_user_idTousers?.name,
      ].some((value) =>
        value?.toLocaleLowerCase('pt-BR').includes(normalizedRequirementsSearch)
      )
    const matchesStatus =
      requirementsStatus === 'ALL' || requirement.status === requirementsStatus
    const matchesPriority =
      requirementsPriority === 'ALL' ||
      requirement.priority === requirementsPriority
    return matchesSearch && matchesStatus && matchesPriority
  })
  const requirementPages = Math.max(
    DEFAULT_PAGE,
    Math.ceil(filteredRequirements.length / REQUIREMENTS_PAGE_SIZE)
  )
  const visibleRequirements = filteredRequirements.slice(
    (requirementsPage - DEFAULT_PAGE) * REQUIREMENTS_PAGE_SIZE,
    requirementsPage * REQUIREMENTS_PAGE_SIZE
  )

  return (
    <div className='mx-auto max-w-7xl'>
      <GoBack page={`Projetos / ${data.name}`} />
      <PageHeader
        title={data.name}
        description={data.client ?? 'Sem cliente informado'}
        action={
          <div className='flex flex-wrap gap-2'>
            <a
              href={`/api/projects/${id}/pdf`}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              <Download /> Baixar PDF
            </a>
            {data.canEditProject && (
              <>
                <Button
                  variant='outline'
                  onClick={() => setEditingProject(true)}
                >
                  <Pencil /> Editar
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => setDeletingProject(true)}
                >
                  <Trash2 /> Excluir
                </Button>
              </>
            )}
          </div>
        }
      />
      <section className='mb-6 grid gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3'>
        <Summary label='Equipe responsável'>
          <strong>{data.team.name}</strong>
        </Summary>
        <Summary label='Gestor atual'>
          <div className='flex flex-col gap-1'>
            <strong>{data.team.leader?.name ?? 'Não definido'}</strong>
            <span className='text-xs text-muted-foreground'>
              Derivado da liderança da equipe
            </span>
          </div>
        </Summary>
        <Summary label='Data de início'>
          <strong>{dateLabel(data.start_date)}</strong>
        </Summary>
        <Summary label='Conclusão prevista'>
          <strong>{dateLabel(data.expected_completion_date)}</strong>
        </Summary>
        <Summary label='Status do projeto'>
          <StatusBadge value={projectStatusLabel(data.status)} />
        </Summary>
        <Summary label='Progresso calculado'>
          <Progress value={data.progress} />
          <span className='text-xs text-muted-foreground'>
            Requisitos concluídos / total
          </span>
        </Summary>
      </section>
      <Card className='mb-6 gap-0 py-0'>
        <CardHeader className='px-6 pb-3 pt-5'>
          <CardTitle className='text-sm'>Stack tecnológica</CardTitle>
        </CardHeader>
        <CardContent className='px-6 pb-5'>
          {data.tech_stack.length ? (
            <div className='flex flex-wrap gap-2'>
              {data.tech_stack.map((technology) => (
                <Badge key={technology} variant='secondary'>
                  {technology}
                </Badge>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Nenhuma tecnologia informada.
            </p>
          )}
        </CardContent>
      </Card>
      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='flex flex-col justify-between gap-4 border-b px-6 py-5 md:flex-row md:items-center'>
          <CardTitle className='text-sm'>
            Requisitos{' '}
            <span className='ml-2 font-normal text-muted-foreground'>
              Requisitos → Desenvolvimento → Testes → Concluído
            </span>
          </CardTitle>
          {data.canManage && (
            <Button size='lg' onClick={() => setCreatingRequirement(true)}>
              <Plus /> Novo requisito
            </Button>
          )}
        </CardHeader>
        <div className='grid gap-3 border-b p-4 md:grid-cols-[minmax(16rem,1fr)_12rem_12rem]'>
          <ListSearch
            value={requirementsSearch}
            onChange={(value) => {
              setRequirementsSearch(value)
              setRequirementsPage(DEFAULT_PAGE)
            }}
            placeholder='Buscar por código, requisito ou responsável...'
            label='Buscar requisitos'
          />
          <ListFilter
            label='Status do requisito'
            value={requirementsStatus}
            onChange={(value) => {
              setRequirementsStatus(value)
              setRequirementsPage(DEFAULT_PAGE)
            }}
          >
            <option value='ALL'>Todos os status</option>
            <option value='REQUIREMENTS'>Requisitos</option>
            <option value='DEVELOPMENT'>Em desenvolvimento</option>
            <option value='TESTING'>Em testes</option>
            <option value='COMPLETED'>Concluídos</option>
          </ListFilter>
          <ListFilter
            label='Prioridade do requisito'
            value={requirementsPriority}
            onChange={(value) => {
              setRequirementsPriority(value)
              setRequirementsPage(DEFAULT_PAGE)
            }}
          >
            <option value='ALL'>Todas as prioridades</option>
            <option value='LOW'>Baixa</option>
            <option value='MEDIUM'>Média</option>
            <option value='HIGH'>Alta</option>
            <option value='CRITICAL'>Crítica</option>
          </ListFilter>
        </div>
        <CardContent className='p-0'>
          {!data.requirements.length ? (
            <div className='p-8 text-sm text-muted-foreground'>
              Nenhum requisito cadastrado neste projeto.
            </div>
          ) : !filteredRequirements.length ? (
            <div className='p-8 text-sm text-muted-foreground'>
              Nenhum requisito corresponde aos filtros selecionados.
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
                    {data.canManage && (
                      <TableHead className='w-24 text-right'>Ações</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRequirements.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className='font-semibold'>
                        <Link
                          href={`/projects/${id}/requirements/${r.id}`}
                          className='font-mono text-primary transition-colors hover:text-primary/80'
                        >
                          {r.code}
                        </Link>
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
                      {data.canManage && (
                        <TableCell>
                          <div className='flex justify-end gap-1'>
                            <Button
                              size='icon-sm'
                              variant='outline'
                              aria-label={`Editar ${r.code}`}
                              onClick={() => setEditingRequirement(r)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size='icon-sm'
                              variant='outline'
                              className='text-destructive'
                              aria-label={`Excluir ${r.code}`}
                              onClick={() => setDeletingRequirement(r)}
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
              <Pagination
                page={requirementsPage}
                totalPages={requirementPages}
                onPageChange={setRequirementsPage}
              />
            </>
          )}
        </CardContent>
      </Card>
      {data.canManage && (
        <>
          <RequirementFormDialog
            projectId={id}
            open={creatingRequirement}
            onOpenChange={setCreatingRequirement}
          />
          <RequirementFormDialog
            projectId={id}
            requirement={editingRequirement}
            open={editingRequirement !== null}
            onOpenChange={(open) => !open && setEditingRequirement(null)}
          />
          <DeleteRequirementDialog
            projectId={id}
            requirement={deletingRequirement}
            open={deletingRequirement !== null}
            onOpenChange={(open) => !open && setDeletingRequirement(null)}
          />
        </>
      )}
      {data.canEditProject && (
        <>
          <ProjectFormDialog
            project={data}
            open={editingProject}
            onOpenChange={setEditingProject}
          />
          <DeleteProjectDialog
            project={data}
            open={deletingProject}
            onOpenChange={setDeletingProject}
          />
        </>
      )}
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
    <div className='flex min-h-24 flex-col gap-2 bg-card p-6'>
      <span className='text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground'>
        {label}
      </span>
      <div className='text-sm text-foreground'>{children}</div>
    </div>
  )
}
