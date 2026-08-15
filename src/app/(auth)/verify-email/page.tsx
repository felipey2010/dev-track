import { redirect } from 'next/navigation'
import { EmailVerificationForm } from '@/components/auth/email-verification-form'
import { emailVerificationSchema } from '@/lib/auth/validation'

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

  return <EmailVerificationForm verificationId={validId.data} />
}
