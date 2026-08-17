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
import { deleteProject } from '@/lib/client-api/projects'
import type { ProjectDetail } from '@/lib/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteProject(project.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      onOpenChange(false)
      router.push('/projects')
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !mutation.isPending && onOpenChange(nextOpen)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir projeto?</DialogTitle>
          <DialogDescription>
            O projeto{' '}
            <strong className='text-foreground'>{project.name}</strong> será
            excluído permanentemente. Projetos com requisitos não podem ser
            excluídos.
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
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Excluindo...' : 'Excluir projeto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
