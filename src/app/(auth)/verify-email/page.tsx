import { EmailVerificationForm } from '@/components/auth/email-verification-form'
import { AuthCard } from '@/components/auth/auth-card'
import { emailVerificationSchema } from '@/lib/auth/validation'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Verificar e-mail',
  description: 'Confirme o endereço de e-mail da sua conta.',
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>
}) {
  const { id } = await searchParams
  const verificationId = typeof id === 'string' ? id : ''
  const validId =
    emailVerificationSchema.shape.verificationId.safeParse(verificationId)
  if (!validId.success) redirect('/login')

  return (
    <AuthCard>
      <EmailVerificationForm verificationId={validId.data} />
    </AuthCard>
  )
}
