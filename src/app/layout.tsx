import { Providers } from '@/components/providers'
import { APP_IDENTITY } from '@/lib/app-identity'
import type { Metadata } from 'next'
import { fraunces, ibmPlexMono, poppins } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  applicationName: APP_IDENTITY.name,
  title: {
    default: APP_IDENTITY.name,
    template: `%s | ${APP_IDENTITY.name}`,
  },
  description:
    'Plataforma interna para acompanhamento de projetos, requisitos, desenvolvimento e testes de software.',
  keywords: [
    'gestão de projetos',
    'requisitos de software',
    'desenvolvimento de software',
    'controle de testes',
  ],
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: APP_IDENTITY.name,
    title: APP_IDENTITY.name,
    description:
      'Acompanhamento interno de projetos e requisitos de software.',
  },
  twitter: {
    card: 'summary',
    title: APP_IDENTITY.name,
    description:
      'Acompanhamento interno de projetos e requisitos de software.',
  },
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
