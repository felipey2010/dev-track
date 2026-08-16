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
import { createProject } from '@/lib/client-api/projects'
import {
  projectFormSchema,
  type ProjectFormData,
  type ProjectFormInput,
} from '@/lib/projects/validation'
import type { Team } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import ProjectField from './project-label'
import { USER_STATUS } from '@/lib/auth/constants'

const defaults: ProjectFormInput = {
  name: '',
  client: '',
  description: '',
  teamId: '',
  status: 'PLANNING',
  startDate: '',
  expectedCompletionDate: '',
}

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
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

  const mutation = useMutation({
    mutationFn: async (payload: ProjectFormData) => {
      return createProject(payload)
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['projects'] })
      form.reset(defaults)
      setOpen(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='lg' className='gap-2'>
          <Plus className='size-4' />
          Novo projeto
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>
            Somente projetos das equipes que você lidera podem ser criados.
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
                  modal={false}
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
            label='Status inicial'
            htmlFor='project-status'
            error={form.formState.errors.status?.message}
          >
            <Controller
              control={form.control}
              name='status'
              render={({ field }) => (
                <Select
                  modal={false}
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
                  </SelectContent>
                </Select>
              )}
            />
          </ProjectField>
          <ProjectField
            label='Data de início'
            htmlFor='project-start'
            error={form.formState.errors.startDate?.message}
          >
            <Input
              id='project-start'
              type='date'
              lang='pt-BR'
              {...form.register('startDate')}
            />
          </ProjectField>
          <ProjectField
            label='Conclusão prevista'
            htmlFor='project-due'
            error={form.formState.errors.expectedCompletionDate?.message}
          >
            <Input
              id='project-due'
              type='date'
              lang='pt-BR'
              {...form.register('expectedCompletionDate')}
            />
          </ProjectField>
          {mutation.error && (
            <p role='alert' className='text-xs text-destructive sm:col-span-2'>
              {mutation.error.message}
            </p>
          )}
          <DialogFooter className='sm:col-span-2'>
            <Button
              type='submit'
              disabled={mutation.isPending || form.formState.isSubmitting}
            >
              {mutation.isPending ? 'Criando...' : 'Criar projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
