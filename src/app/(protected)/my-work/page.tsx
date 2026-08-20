import { MyWorkBoard } from '@/components/my-work/my-work-board'
import { PageHeader } from '@/components/ui'
import { getMyWork } from '@/lib/services/my-work'
import { requireActiveUser } from '@/server/authorization/session'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meu trabalho',
  description: 'Requisitos atribuídos e disponíveis para o seu trabalho.',
}

export default async function MyWorkPage() {
  const user = await requireActiveUser()
  const items = await getMyWork(user.id)

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        eyebrow='FOCO DO DIA'
        title='Meu trabalho'
        description='Acompanhe suas responsabilidades, prazos e itens disponíveis para assumir.'
      />
      <MyWorkBoard items={items} />
    </div>
  )
}
