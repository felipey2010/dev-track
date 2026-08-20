'use client'

import ProjectField from '@/components/projects/project-label'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  createRequirement,
  updateRequirement,
} from '@/lib/client-api/requirements'
import {
  requirementFormSchema,
  type RequirementFormData,
  type RequirementFormInput,
} from '@/lib/requirements/validation'
import type { Requirement } from '@/lib/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

const defaults: RequirementFormInput = {
  title: '',
  description: '',
  type: 'FUNCTIONAL',
  priority: 'MEDIUM',
  deadline: '',
}

type Props = {
  projectId: string
  requirement?: Requirement | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequirementFormDialog({
  projectId,
  requirement,
  open,
  onOpenChange,
}: Props) {
  const queryClient = useQueryClient()
  const form = useForm<RequirementFormInput, unknown, RequirementFormData>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      requirement
        ? {
            title: requirement.title,
            description: requirement.description,
            type: requirement.type,
            priority: requirement.priority,
            deadline: requirement.deadline?.slice(0, 10) ?? '',
          }
        : defaults
    )
  }, [form, open, requirement])

  const mutation = useMutation({
    mutationFn: (input: RequirementFormData) =>
      requirement
        ? updateRequirement(projectId, requirement.id, input)
        : createRequirement(projectId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [`project-${projectId}`],
      })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {requirement ? 'Editar requisito' : 'Novo requisito'}
          </DialogTitle>
          <DialogDescription>
            Defina os dados do requisito. Status e responsável são controlados
            pelo fluxo de trabalho.
          </DialogDescription>
        </DialogHeader>
        <form
          className='grid gap-4 py-2 sm:grid-cols-2'
          onSubmit={form.handleSubmit((input) => mutation.mutate(input))}
          noValidate
        >
          <ProjectField
            label='Título'
            htmlFor='requirement-title'
            error={form.formState.errors.title?.message}
            wide
          >
            <Input
              id='requirement-title'
              autoFocus
              {...form.register('title')}
            />
          </ProjectField>
          <ProjectField
            label='Descrição'
            htmlFor='requirement-description'
            error={form.formState.errors.description?.message}
            wide
          >
            <Textarea
              id='requirement-description'
              rows={4}
              {...form.register('description')}
            />
          </ProjectField>
          <ProjectField
            label='Tipo'
            htmlFor='requirement-type'
            error={form.formState.errors.type?.message}
          >
            <Controller
              control={form.control}
              name='type'
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id='requirement-type'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='FUNCTIONAL'>Funcional</SelectItem>
                    <SelectItem value='NON_FUNCTIONAL'>
                      Não funcional
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </ProjectField>
          <ProjectField
            label='Prioridade'
            htmlFor='requirement-priority'
            error={form.formState.errors.priority?.message}
          >
            <Controller
              control={form.control}
              name='priority'
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id='requirement-priority'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='LOW'>Baixa</SelectItem>
                    <SelectItem value='MEDIUM'>Média</SelectItem>
                    <SelectItem value='HIGH'>Alta</SelectItem>
                    <SelectItem value='CRITICAL'>Crítica</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </ProjectField>
          <ProjectField
            label='Prazo'
            htmlFor='requirement-deadline'
            error={form.formState.errors.deadline?.message}
          >
            <Input
              id='requirement-deadline'
              type='date'
              lang='pt-BR'
              {...form.register('deadline')}
            />
          </ProjectField>
          {mutation.error && (
            <p role='alert' className='text-sm text-destructive sm:col-span-2'>
              {mutation.error.message}
            </p>
          )}
          <DialogFooter className='sm:col-span-2'>
            <Button
              type='button'
              size='lg'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={mutation.isPending} size='lg'>
              {mutation.isPending ? 'Salvando...' : 'Salvar requisito'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
