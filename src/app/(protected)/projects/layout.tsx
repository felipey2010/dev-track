import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projetos',
  description: 'Acompanhe o portfólio, os requisitos e a evolução dos projetos.',
}

export default function ProjectsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
