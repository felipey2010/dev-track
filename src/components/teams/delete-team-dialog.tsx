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
import { deleteTeam } from '@/lib/client-api/teams'
import type { Team } from '@/lib/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  team: Team | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteTeamDialog({ team, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteTeam(team!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir equipe?</DialogTitle>
          <DialogDescription>
            Esta ação excluirá permanentemente a equipe{' '}
            <strong className='text-foreground'>{team?.name}</strong> e suas
            associações de membros. Equipes vinculadas a projetos não podem ser
            excluídas.
          </DialogDescription>
        </DialogHeader>
        {mutation.error && (
          <p role='alert' className='text-sm text-destructive'>
            {mutation.error.message}
          </p>
        )}
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            variant='destructive'
            disabled={!team || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Excluindo...' : 'Excluir equipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
