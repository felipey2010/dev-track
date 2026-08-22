import { UserNotFound } from '@/components/feedback/user-not-found'
import GoBack from '@/components/go-back-button'
import { UserAssociations } from '@/components/users/user-associations'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { USER_STATUS } from '@/lib/auth/constants'
import { getUserProfile } from '@/lib/services/users'
import { getInitials } from '@/lib/utils'
import { identifierSchema } from '@/lib/validation/common'
import { requireActiveUser } from '@/server/authorization/session'
import { Mail, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Perfil do usuário',
  description: 'Consulte os dados, equipes e projetos do usuário.',
}

const statusLabels = {
  ACTIVE: 'Ativo',
  PENDING: 'Pendente',
  SUSPENDED: 'Suspenso',
  REJECTED: 'Rejeitado',
} as const

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireActiveUser()
  const parsedId = identifierSchema.safeParse((await params).id)
  if (!parsedId.success) return <UserNotFound />
  const user = await getUserProfile(parsedId.data)
  if (!user) return <UserNotFound />

  const initials = getInitials(user.name)

  return (
    <div className='mx-auto max-w-7xl'>
      <GoBack page={`Usuários / ${user.name}`} />
      <div className='flex flex-col gap-4'>
        <Card className='py-0'>
          <CardContent className='flex flex-col gap-5 p-6 sm:flex-row sm:items-center'>
            <Avatar className='size-18.5 border border-border'>
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback className='bg-accent text-xl font-bold text-primary'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 flex-1'>
              <div className='mb-2 flex flex-wrap items-center gap-2'>
                <h1 className='text-[28px] font-bold tracking-[-.02em]'>
                  {user.name}
                </h1>
                <Badge
                  variant='outline'
                  className={
                    user.status === USER_STATUS.ACTIVE
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                      : ''
                  }
                >
                  <span className='size-1.5 rounded-full bg-current' />{' '}
                  {statusLabels[user.status]}
                </Badge>
              </div>
              <div className='flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-5'>
                <span className='flex items-center gap-1.5'>
                  <Mail className='size-4' />
                  {user.email}
                </span>
                <span className='flex items-center gap-1.5'>
                  <ShieldCheck className='size-4' />
                  {user.systemRole === 'ADMIN' ? 'Administrador' : 'Usuário'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <UserAssociations teams={user.teams} projects={user.projects} />
      </div>
    </div>
  )
}
