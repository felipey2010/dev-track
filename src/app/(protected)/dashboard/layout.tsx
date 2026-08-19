import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Visão geral dos projetos, equipes e atividades recentes.',
}

export default function DashboardPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
