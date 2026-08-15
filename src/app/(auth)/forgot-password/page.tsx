import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PasswordResetRequestForm } from '@/components/auth/password-reset-request-form'

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
