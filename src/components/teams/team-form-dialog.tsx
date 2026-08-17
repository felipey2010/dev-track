'use client'

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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createTeam, updateTeam } from '@/lib/client-api/teams'
import { teamFormSchema, type TeamFormData } from '@/lib/teams/validation'
import type { Team, TeamDetail, TeamUserOption } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/client-api/http'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

const defaults: TeamFormData = {
  name: '',
  description: '',
  leaderId: '',
  members: [],
}

type Props = {
  team?: Team | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamFormDialog({ team, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const { data: users, isLoading: loadingUsers } = useApi<TeamUserOption[]>(
    'team-user-options',
    '/api/teams/user-options'
  )
  const detailQuery = useQuery({
    queryKey: ['team', team?.id],
    queryFn: () => apiRequest<TeamDetail>(`/api/teams/${team!.id}`),
    enabled: open && Boolean(team),
  })
  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (!open) return
    if (!team) form.reset(defaults)
    else if (detailQuery.data)
      form.reset({
        name: detailQuery.data.name,
        description: detailQuery.data.description ?? '',
        leaderId: detailQuery.data.leader_id ?? '',
        members: detailQuery.data.team_members.map((member) => ({
          userId: member.users.id,
          role: member.role,
        })),
      })
  }, [detailQuery.data, form, open, team])

  const mutation = useMutation({
    mutationFn: (input: TeamFormData) =>
      team ? updateTeam(team.id, input) : createTeam(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      if (team)
        await queryClient.invalidateQueries({ queryKey: ['team', team.id] })
      onOpenChange(false)
    },
  })
  const members = useWatch({ control: form.control, name: 'members' })
  const leaderId = useWatch({ control: form.control, name: 'leaderId' })
  const loading = loadingUsers || Boolean(team && detailQuery.isLoading)

  function toggleMember(userId: string, checked: boolean) {
    const current = form.getValues('members')
    form.setValue(
      'members',
      checked
        ? [...current, { userId, role: 'DEVELOPER' }]
        : current.filter((member) => member.userId !== userId),
      { shouldDirty: true, shouldValidate: true }
    )
  }

  function changeRole(userId: string, role: 'DEVELOPER' | 'TESTER') {
    form.setValue(
      'members',
      form
        .getValues('members')
        .map((member) =>
          member.userId === userId ? { ...member, role } : member
        ),
      { shouldDirty: true, shouldValidate: true }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{team ? 'Editar equipe' : 'Nova equipe'}</DialogTitle>
          <DialogDescription>
            Defina a liderança e as responsabilidades dos membros da equipe.
          </DialogDescription>
        </DialogHeader>
        {detailQuery.error ? (
          <p role='alert' className='text-sm text-destructive'>
            {detailQuery.error.message}
          </p>
        ) : (
          <form
            className='flex flex-col gap-4'
            onSubmit={form.handleSubmit((input) => mutation.mutate(input))}
            noValidate
          >
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Nome' error={form.formState.errors.name?.message}>
                <Input
                  autoFocus
                  disabled={loading}
                  {...form.register('name')}
                />
              </Field>
              <Field
                label='Liderança'
                error={form.formState.errors.leaderId?.message}
              >
                <Controller
                  control={form.control}
                  name='leaderId'
                  render={({ field }) => (
                    <Select
                      value={field.value || '__none'}
                      onValueChange={(value) => {
                        const nextLeader = value === '__none' ? '' : value
                        field.onChange(nextLeader)
                        if (nextLeader)
                          form.setValue(
                            'members',
                            form
                              .getValues('members')
                              .filter((member) => member.userId !== nextLeader),
                            { shouldDirty: true, shouldValidate: true }
                          )
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Selecione uma liderança' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__none'>Sem liderança</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field
                label='Descrição'
                error={form.formState.errors.description?.message}
                wide
              >
                <Textarea
                  rows={3}
                  disabled={loading}
                  {...form.register('description')}
                />
              </Field>
            </div>
            <div className='flex flex-col gap-2'>
              <div>
                <Label htmlFor='selecionar_usuario_descricao'>Membros</Label>
                <p
                  id='selecionar_usuario_descricao'
                  className='text-xs text-muted-foreground'
                >
                  Selecione os membros e atribua a função de cada um.
                </p>
              </div>
              <div className='max-h-56 divide-y overflow-y-auto rounded-lg border'>
                {loading ? (
                  <p className='p-4 text-sm text-muted-foreground'>
                    Carregando usuários...
                  </p>
                ) : !users?.length ? (
                  <p className='p-4 text-sm text-muted-foreground'>
                    Nenhum usuário ativo disponível.
                  </p>
                ) : (
                  users
                    .filter((user) => user.id !== leaderId)
                    .map((user) => {
                      const member = members.find(
                        (item) => item.userId === user.id
                      )
                      return (
                        <div
                          key={user.id}
                          className='flex items-center gap-3 p-3'
                        >
                          <input
                            type='checkbox'
                            className='size-4 accent-primary'
                            checked={Boolean(member)}
                            onChange={(event) =>
                              toggleMember(user.id, event.target.checked)
                            }
                            aria-label={`Adicionar ${user.name}`}
                          />
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium'>
                              {user.name}
                            </p>
                            <p className='truncate text-xs text-muted-foreground'>
                              {user.email}
                            </p>
                          </div>
                          {member && (
                            <Select
                              value={member.role}
                              onValueChange={(role) =>
                                changeRole(
                                  user.id,
                                  role as 'DEVELOPER' | 'TESTER'
                                )
                              }
                            >
                              <SelectTrigger className='w-36'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className='text-sm'>
                                <SelectItem value='DEVELOPER'>
                                  Desenvolvedor
                                </SelectItem>
                                <SelectItem value='TESTER'>Testador</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )
                    })
                )}
              </div>
              {form.formState.errors.members?.message && (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.members.message}
                </p>
              )}
            </div>
            {mutation.error && (
              <p role='alert' className='text-sm text-destructive'>
                {mutation.error.message}
              </p>
            )}
            <DialogFooter>
              <Button
                size='lg'
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                size='lg'
                type='submit'
                disabled={loading || mutation.isPending}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar equipe'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string
  error?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={
        wide ? 'flex flex-col gap-1.5 sm:col-span-2' : 'flex flex-col gap-1.5'
      }
    >
      <Label>{label}</Label>
      {children}
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  )
}
