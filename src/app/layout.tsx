import { Providers } from '@/components/providers'
import { APP_IDENTITY } from '@/lib/app-identity'
import type { Metadata } from 'next'
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
