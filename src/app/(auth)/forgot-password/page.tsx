import { PasswordResetRequestForm } from '@/components/auth/password-reset-request-form'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Recuperar senha',
  description: 'Solicite a recuperação da senha da sua conta.',
}

export default function ForgotPasswordPage() {
  return (
    <div className='mt-10'>
      <Link
        href='/login'
        className='flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' /> Voltar para login
      </Link>
      <PasswordResetRequestForm />
    </div>
  )
}
