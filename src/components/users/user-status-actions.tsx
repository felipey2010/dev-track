'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserAccess } from '@/lib/client-api/users'
import type { UserAccessFormData } from '@/lib/users/validation'
import { getInitials } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { useState } from 'react'

type Props = {
  id: string
  name: string
  email: string
  image: string | null
  status: UserAccessFormData['status']
  systemRole: UserAccessFormData['systemRole']
}

const roleLabels: Record<UserAccessFormData['systemRole'], string> = {
  USER: 'Usuário',
  ADMIN: 'Administrador',
}

const statusLabels: Record<UserAccessFormData['status'], string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  REJECTED: 'Rejeitado',
}

export function UserStatusActions({
  id,
  name,
  email,
  image,
  status,
  systemRole,
}: Props) {
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<UserAccessFormData>({
    status,
    systemRole,
  })
  const editMutation = useMutation({
    mutationFn: (input: UserAccessFormData) => updateUserAccess(id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['users'] })
      await client.invalidateQueries({ queryKey: [`user-${id}`] })
      setOpen(false)
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft({ status, systemRole })
      editMutation.reset()
    }
    setOpen(nextOpen)
  }

  const initials = getInitials(name)

  return (
    <div className='flex flex-wrap gap-2'>
      <Button
        size='sm'
        variant='outline'
        onClick={() => handleOpenChange(true)}
      >
        <Pencil className='size-3 mr-1' />
        Editar
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>
              Confira a conta abaixo antes de alterar suas permissões.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='flex items-center gap-3 rounded-lg border bg-muted/30 p-3'>
              <Avatar size='lg'>
                {image && <AvatarImage src={image} alt='' />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold'>{name}</p>
                <p className='truncate text-xs text-muted-foreground'>
                  {email}
                </p>
                <div className='mt-2 flex flex-wrap gap-1.5'>
                  <Badge variant='secondary'>{roleLabels[systemRole]}</Badge>
                  <Badge variant='outline'>{statusLabels[status]}</Badge>
                </div>
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor={`user-role-${id}`}>Papel</Label>
              <Select
                name='systemRole'
                value={draft.systemRole}
                onValueChange={(nextRole) =>
                  setDraft((current) => ({
                    ...current,
                    systemRole: nextRole as UserAccessFormData['systemRole'],
                  }))
                }
              >
                <SelectTrigger id={`user-role-${id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USER'>Usuário</SelectItem>
                  <SelectItem value='ADMIN'>Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor={`user-status-${id}`}>Situação</Label>
              <Select
                name='status'
                value={draft.status}
                onValueChange={(nextStatus) =>
                  setDraft((current) => ({
                    ...current,
                    status: nextStatus as UserAccessFormData['status'],
                  }))
                }
              >
                <SelectTrigger id={`user-status-${id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PENDING'>Pendente</SelectItem>
                  <SelectItem value='ACTIVE'>Ativo</SelectItem>
                  <SelectItem value='SUSPENDED'>Suspenso</SelectItem>
                  <SelectItem value='REJECTED'>Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editMutation.error && (
              <p role='alert' className='text-sm text-destructive'>
                {editMutation.error.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              disabled={editMutation.isPending}
              onClick={() => editMutation.mutate(draft)}
            >
              {editMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
