'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { USER_STATUS } from '@/lib/auth/constants'
import { createProject, updateProject } from '@/lib/client-api/projects'
import { PROJECT_DEVELOPMENT_STATUS } from '@/lib/projects/constants'
import {
  projectFormSchema,
  type ProjectFormData,
  type ProjectFormInput,
} from '@/lib/projects/validation'
import type { ProjectDetail, Team } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import ProjectField from './project-label'
import { TechStackInput } from './tech-stack-input'
import { LocalizedDateInput } from './localized-date-input'

const defaults: ProjectFormInput = {
  name: '',
  client: '',
  description: '',
  teamId: '',
  status: 'PLANNING',
  startDate: '',
  expectedCompletionDate: '',
  techStack: [],
}

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  return (
    <ProjectFormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size='lg' className='gap-2'>
          <Plus className='size-4' />
          Novo projeto
        </Button>
      }
    />
  )
}

export function ProjectFormDialog({
  project,
  open,
  onOpenChange,
  trigger,
}: {
  project?: ProjectDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
}) {
  const client = useQueryClient()
  const { data: teams, isLoading } = useApi<Team[]>('teams', '/api/teams')
  const eligible =
    teams?.filter(
      (team) => team.canManage && team.users?.status === USER_STATUS.ACTIVE
    ) ?? []
  const form = useForm<ProjectFormInput, unknown, ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      project
        ? {
            name: project.name,
            client: project.client ?? '',
            description: project.description,
            teamId: project.team.id,
            status: project.status as ProjectFormInput['status'],
            startDate: project.start_date.slice(0, 10),
            expectedCompletionDate:
              project.expected_completion_date?.slice(0, 10) ?? '',
            techStack: project.tech_stack,
          }
        : defaults
    )
  }, [form, open, project])

  const mutation = useMutation({
    mutationFn: async (payload: ProjectFormData) => {
      return project
        ? updateProject(project.id, payload)
        : createProject(payload)
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['projects'] })
      if (project)
        await client.invalidateQueries({ queryKey: [`project-${project.id}`] })
      form.reset(defaults)
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {project ? 'Editar projeto' : 'Novo projeto'}
          </DialogTitle>
          <DialogDescription>
            {project
              ? 'Atualize as informações e o status gerencial do projeto.'
              : 'Somente projetos das equipes que você lidera podem ser criados.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className='grid gap-4 py-2 sm:grid-cols-2'
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <ProjectField
            label='Nome'
            htmlFor='project-name'
            error={form.formState.errors.name?.message}
          >
            <Input
              id='project-name'
              placeholder='Nome do projeto'
              {...form.register('name')}
            />
          </ProjectField>
          <ProjectField
            label='Cliente'
            htmlFor='project-client'
            error={form.formState.errors.client?.message}
          >
            <Input
              id='project-client'
              placeholder='Cliente (opcional)'
              {...form.register('client')}
            />
          </ProjectField>
          <ProjectField
            label='Descrição'
            htmlFor='project-description'
            error={form.formState.errors.description?.message}
            wide
          >
            <Textarea
              id='project-description'
              rows={4}
              placeholder='Objetivo e escopo resumido'
              {...form.register('description')}
            />
          </ProjectField>
          <ProjectField
            label='Equipe'
            htmlFor='project-team'
            error={form.formState.errors.teamId?.message}
          >
            <Controller
              control={form.control}
              name='teamId'
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading || !eligible.length}
                >
                  <SelectTrigger id='project-team' className='w-full'>
                    <SelectValue
                      placeholder={
                        isLoading ? 'Carregando...' : 'Selecione uma equipe'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {eligible.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} — {team.users?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </ProjectField>
          <ProjectField
            label={project ? 'Status' : 'Status inicial'}
            htmlFor='project-status'
            error={form.formState.errors.status?.message}
          >
            <Controller
              control={form.control}
              name='status'
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id='project-status' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PLANNING'>Planejamento</SelectItem>
                    <SelectItem value='IN_DEVELOPMENT'>
                      Em desenvolvimento
                    </SelectItem>
                    {project && (
                      <>
                        {PROJECT_DEVELOPMENT_STATUS.map((status) => (
                          <SelectItem value={status.value} key={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </ProjectField>
          <ProjectField
            label='Tecnologias'
            htmlFor='project-tech-stack'
            error={form.formState.errors.techStack?.message}
            wide
          >
            <Controller
              control={form.control}
              name='techStack'
              render={({ field }) => (
                <TechStackInput value={field.value} onChange={field.onChange} />
              )}
            />
          </ProjectField>
          <ProjectField
            label='Data de início'
            htmlFor='project-start'
            error={form.formState.errors.startDate?.message}
          >
            <Controller
              control={form.control}
              name='startDate'
              render={({ field }) => (
                <LocalizedDateInput
                  key={`${open}-${project?.id ?? 'new'}-start`}
                  id='project-start'
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              )}
            />
          </ProjectField>
          <ProjectField
            label='Conclusão prevista'
            htmlFor='project-due'
            error={form.formState.errors.expectedCompletionDate?.message}
          >
            <Controller
              control={form.control}
              name='expectedCompletionDate'
              render={({ field }) => (
                <LocalizedDateInput
                  key={`${open}-${project?.id ?? 'new'}-due`}
                  id='project-due'
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </ProjectField>
          {mutation.error && (
            <p role='alert' className='text-xs text-destructive sm:col-span-2'>
              {mutation.error.message}
            </p>
          )}
          <DialogFooter className='sm:col-span-2'>
            <Button
              type='button'
              variant='outline'
              size='lg'
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              size='lg'
              disabled={mutation.isPending || form.formState.isSubmitting}
            >
              {mutation.isPending
                ? 'Salvando...'
                : project
                  ? 'Salvar projeto'
                  : 'Criar projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
