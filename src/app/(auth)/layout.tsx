import { AuthBrand } from '@/components/auth/auth-brand'
import GoogleRecaptchaWrapper from '@/components/auth/google-recaptcha-wrapper'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GoogleRecaptchaWrapper>
      <main className='grid min-h-dvh place-items-center bg-background px-4 py-10'>
        <div className='w-full max-w-90'>
          <AuthBrand />
          {children}
        </div>
      </main>
    </GoogleRecaptchaWrapper>
  )
}
