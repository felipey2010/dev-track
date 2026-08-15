import { redirect } from 'next/navigation'
import { PasswordResetForm } from '@/components/auth/password-reset-form'
import { passwordResetCodeSchema } from '@/lib/auth/validation'

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

  return <PasswordResetForm resetId={parsed.data} />
}
