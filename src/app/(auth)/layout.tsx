import { AuthBrand } from '@/components/auth/auth-brand'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className='grid min-h-screen place-items-center bg-background px-4 py-10'>
      <div className='w-full max-w-90'>
        <AuthBrand />
        {children}
      </div>
    </main>
  )
}
