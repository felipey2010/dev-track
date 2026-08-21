import { AuthBrand } from '@/components/auth/auth-brand'
import GoogleRecaptchaWrapper from '@/components/auth/google-recaptcha-wrapper'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata: Metadata = {
  title: 'Acesso',
  description: 'Acesse sua conta no Dev Track.',
  robots: { index: false, follow: false, nocache: true },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GoogleRecaptchaWrapper>
      <main className='app-surface relative grid min-h-dvh place-items-center bg-background px-5 py-16 sm:px-6'>
        <div className='absolute right-5 top-5 rounded-full border border-border/70 bg-card p-1 shadow-lg sm:right-7 sm:top-6'>
          <ThemeToggle />
        </div>
        <div className='w-full max-w-[440px]'>
          <AuthBrand />
          {children}
        </div>
      </main>
    </GoogleRecaptchaWrapper>
  )
}
