'use client'

import { Button } from '@/components/ui/button'
import { executeRequirementWorkflow } from '@/lib/client-api/requirement-workflow'
import type { RequirementWorkflowAction } from '@/lib/requirements/workflow'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

const labels: Record<RequirementWorkflowAction, string> = {
  START_DEVELOPMENT: 'Iniciar desenvolvimento',
  CLAIM_DEVELOPMENT: 'Assumir desenvolvimento',
  READY_FOR_TESTING: 'Enviar para testes',
  CLAIM_TESTING: 'Assumir testes',
  COMPLETE: 'Aprovar e concluir',
  RETURN_TO_DEVELOPMENT: 'Reprovar e devolver',
}

export function RequirementWorkflowActions({
  projectId,
  requirementId,
  actions,
}: {
  projectId: string
  requirementId: string
  actions: RequirementWorkflowAction[]
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (action: RequirementWorkflowAction) =>
      executeRequirementWorkflow(projectId, requirementId, action),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [`project-${projectId}`],
      })
      router.refresh()
    },
  })

  if (!actions.length) return null

  return (
    <div className='mb-6 rounded-xl border bg-card p-4'>
      <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
        <div>
          <p className='text-sm font-semibold'>Ações do fluxo</p>
          <p className='text-xs text-muted-foreground'>
            Apenas as ações permitidas para sua função e para a etapa atual são
            exibidas.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {actions.map((action) => (
            <Button
              size='lg'
              key={action}
              type='button'
              variant={
                action === 'RETURN_TO_DEVELOPMENT' ? 'destructive' : 'default'
              }
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(action)}
            >
              {mutation.isPending && mutation.variables === action
                ? 'Atualizando...'
                : labels[action]}
            </Button>
          ))}
        </div>
      </div>
      {mutation.error && (
        <p role='alert' className='mt-3 text-sm text-destructive'>
          {mutation.error.message}
        </p>
      )}
    </div>
  )
}
