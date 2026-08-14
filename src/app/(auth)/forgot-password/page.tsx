import Link from 'next/link'
import { ArrowLeft, KeyRound } from 'lucide-react'
export default function ForgotPasswordPage() {
  return (
    <div className='mt-10'>
      <Link
        href='/login'
        className='flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' />
        Voltar para entrar
      </Link>
      <div className='mt-7'>
        <KeyRound className='size-5 text-primary' />
        <h1 className='mt-4 text-lg font-semibold'>Redefinir senha</h1>
        <p className='mt-2 text-xs leading-5 text-muted-foreground'>
          A recuperação automática ainda não está configurada. Solicite ao
          administrador da sua organização a redefinição segura do acesso.
        </p>
      </div>
    </div>
  )
}
