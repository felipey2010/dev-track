'use client'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/lib/use-api'
import type { Team } from '@/lib/types'
import type { ApiResponse } from '@/lib/api'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [teamId, setTeamId] = useState('')
  const [status, setStatus] = useState('PLANNING')
  const client = useQueryClient()
  const { data: teams, isLoading } = useApi<Team[]>('teams', '/api/teams')
  const eligible =
    teams?.filter(
      (team) => team.canManage && team.users?.status === 'ACTIVE'
    ) ?? []
  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as ApiResponse<{ id: string }>
      if (!response.ok || !body.success) throw new Error(body.message)
      return body
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
    },
  })
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      name: form.get('name'),
      client: form.get('client'),
      description: form.get('description'),
      teamId,
      status,
      startDate: form.get('startDate'),
      expectedCompletionDate: form.get('expectedCompletionDate') || undefined,
    })
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='gap-2'>
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
        <form className='grid gap-4 py-2 sm:grid-cols-2' onSubmit={submit}>
          <Field label='Nome'>
            <Input name='name' placeholder='Nome do projeto' required />
          </Field>
          <Field label='Cliente'>
            <Input name='client' placeholder='Cliente (opcional)' />
          </Field>
          <Field label='Descrição' wide>
            <Textarea
              name='description'
              rows={4}
              placeholder='Objetivo e escopo resumido'
              required
            />
          </Field>
          <Field label='Equipe'>
            <Select
              value={teamId}
              onValueChange={(value) => setTeamId(value ?? '')}
              disabled={isLoading || !eligible.length}
            >
              <SelectTrigger className='w-full'>
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
            {!isLoading && !eligible.length && (
              <p className='text-[10px] text-muted-foreground'>
                Você não lidera uma equipe ativa.
              </p>
            )}
          </Field>
          <Field label='Status inicial'>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value ?? 'PLANNING')}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='PLANNING'>Planejamento</SelectItem>
                <SelectItem value='IN_DEVELOPMENT'>
                  Em desenvolvimento
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label='Data de início'>
            <Input name='startDate' type='date' required />
          </Field>
          <Field label='Conclusão prevista'>
            <Input name='expectedCompletionDate' type='date' />
          </Field>
          {mutation.error && (
            <p role='alert' className='text-xs text-destructive sm:col-span-2'>
              {mutation.error.message}
            </p>
          )}
          <DialogFooter className='sm:col-span-2'>
            <Button type='submit' disabled={mutation.isPending || !teamId}>
              {mutation.isPending ? 'Criando...' : 'Criar projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
function Field({
  label,
  wide,
  children,
}: {
  label: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={wide ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
