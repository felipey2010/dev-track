import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detalhes do projeto',
  description: 'Consulte os dados, requisitos e progresso do projeto.',
}

export default function ProjectDetailsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
