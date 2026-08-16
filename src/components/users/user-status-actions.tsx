'use client'
import { Button } from '@/components/ui/button'
import { USER_STATUS } from '@/lib/auth/constants'
import { changeUserStatus } from '@/lib/client-api/users'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
      return changeUserStatus(id, nextStatus)
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }),
  })
  if (status === USER_STATUS.PENDING)
    return (
      <div className='flex gap-2'>
        <Button
          size='sm'
          onClick={() => mutation.mutate(USER_STATUS.ACTIVE)}
          disabled={mutation.isPending}
        >
          Aprovar
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={() => mutation.mutate(USER_STATUS.REJECTED)}
          disabled={mutation.isPending}
        >
          Rejeitar
        </Button>
      </div>
    )
  if (status === USER_STATUS.ACTIVE)
    return (
      <Button
        size='sm'
        variant='outline'
        onClick={() => mutation.mutate(USER_STATUS.SUSPENDED)}
        disabled={mutation.isPending}
      >
        Suspender
      </Button>
    )
  if (status === USER_STATUS.SUSPENDED)
    return (
      <Button
        size='sm'
        onClick={() => mutation.mutate(USER_STATUS.ACTIVE)}
        disabled={mutation.isPending}
      >
        Reativar
      </Button>
    )
  return <span className='text-[10px] text-muted-foreground'>Sem ações</span>
}
