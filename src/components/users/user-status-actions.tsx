'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import type { ApiResponse } from '@/lib/api'

export function UserStatusActions({
  id,
  status,
}: {
  id: string
  status: string
}) {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (nextStatus: string) => {
      const response = await fetch(`/api/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const body = (await response.json()) as ApiResponse<unknown>
      if (!response.ok) throw new Error(body.message)
      return body
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }),
  })
  if (status === 'PENDING')
    return (
      <div className='flex gap-2'>
        <Button
          size='sm'
          onClick={() => mutation.mutate('ACTIVE')}
          disabled={mutation.isPending}
        >
          Aprovar
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={() => mutation.mutate('REJECTED')}
          disabled={mutation.isPending}
        >
          Rejeitar
        </Button>
      </div>
    )
  if (status === 'ACTIVE')
    return (
      <Button
        size='sm'
        variant='outline'
        onClick={() => mutation.mutate('SUSPENDED')}
        disabled={mutation.isPending}
      >
        Suspender
      </Button>
    )
  if (status === 'SUSPENDED')
    return (
      <Button
        size='sm'
        onClick={() => mutation.mutate('ACTIVE')}
        disabled={mutation.isPending}
      >
        Reativar
      </Button>
    )
  return <span className='text-[10px] text-muted-foreground'>Sem ações</span>
}
