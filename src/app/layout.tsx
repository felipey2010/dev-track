import GoogleRecaptchaWrapper from '@/components/auth/google-recaptcha-wrapper'
import { Providers } from '@/components/providers'
import type { Metadata } from 'next'
import { APP_IDENTITY } from '@/lib/app-identity'
import { fraunces, ibmPlexMono, poppins } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: APP_IDENTITY.name,
  description: 'Acompanhamento de projetos e requisitos de software',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang='pt-BR'
      className={`${poppins.className} ${poppins.variable} ${fraunces.className} ${fraunces.variable} ${ibmPlexMono.className} ${ibmPlexMono.variable} antialiased bg-background font-sans`}
      suppressHydrationWarning
    >
      <body>
        <GoogleRecaptchaWrapper>
          <Providers>{children}</Providers>
        </GoogleRecaptchaWrapper>
      </body>
    </html>
  )
}
