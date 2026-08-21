import { PasswordResetRequestForm } from '@/components/auth/password-reset-request-form'
import { AuthCard } from '@/components/auth/auth-card'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Recuperar senha',
  description: 'Solicite a recuperação da senha da sua conta.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <Link
        href='/login'
        className='mb-7 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary'
      >
        <ArrowLeft className='size-3.5' /> Voltar para login
      </Link>
      <PasswordResetRequestForm />
    </AuthCard>
  )
}
