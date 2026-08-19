import { PasswordResetCodeForm } from '@/components/auth/password-reset-code-form'
import { passwordResetCodeSchema } from '@/lib/auth/validation'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Verificar código',
  description: 'Confirme o código de recuperação da sua conta.',
}

export default async function PasswordResetVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>
}) {
  const { id } = await searchParams
  const parsed = passwordResetCodeSchema.shape.resetId.safeParse(
    typeof id === 'string' ? id : ''
  )

  if (!parsed.success) redirect('/forgot-password')

  return (
    <div className='mt-10'>
      <Link
        href='/login'
        className='flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' /> Voltar para login
      </Link>
      <PasswordResetCodeForm resetId={parsed.data} />
    </div>
  )
}
