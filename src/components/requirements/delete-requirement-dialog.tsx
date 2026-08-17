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
import { deleteRequirement } from '@/lib/client-api/requirements'
import type { Requirement } from '@/lib/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  projectId: string
  requirement: Requirement | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteRequirementDialog({
  projectId,
  requirement,
  open,
  onOpenChange,
}: Props) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteRequirement(projectId, requirement!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [`project-${projectId}`],
      })
      onOpenChange(false)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir requisito?</DialogTitle>
          <DialogDescription>
            O requisito{' '}
            <strong className='text-foreground'>{requirement?.code}</strong>{' '}
            será excluído permanentemente. Requisitos com atribuições ou
            histórico de trabalho não podem ser excluídos.
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
            disabled={!requirement || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Excluindo...' : 'Excluir requisito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
