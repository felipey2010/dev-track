import { PasswordResetForm } from '@/components/auth/password-reset-form'
import { AuthCard } from '@/components/auth/auth-card'
import { passwordResetCodeSchema } from '@/lib/auth/validation'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Redefinir senha',
  description: 'Defina uma nova senha para sua conta.',
}

export default async function PasswordResetPage({
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
    <AuthCard>
      <PasswordResetForm resetId={parsed.data} />
    </AuthCard>
  )
}
