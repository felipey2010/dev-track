'use client'

import { StatusBadge } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { projectStatusLabel } from '@/lib/format'
import Link from 'next/link'
import { useState } from 'react'

const PAGE_SIZE = 5
const teamRoleLabels = {
  LEADER: 'Liderança',
  DEVELOPER: 'Desenvolvedor',
  TESTER: 'Testador',
} as const

type TeamAssociation = {
  id: string
  name: string
  description: string | null
  role: keyof typeof teamRoleLabels
}

type ProjectAssociation = { id: string; name: string; status: string }

export function UserAssociations({
  teams,
  projects,
}: {
  teams: TeamAssociation[]
  projects: ProjectAssociation[]
}) {
  const [teamPage, setTeamPage] = useState(1)
  const [projectPage, setProjectPage] = useState(1)
  const teamPages = Math.max(1, Math.ceil(teams.length / PAGE_SIZE))
  const projectPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE))
  const visibleTeams = teams.slice(
    (teamPage - 1) * PAGE_SIZE,
    teamPage * PAGE_SIZE
  )
  const visibleProjects = projects.slice(
    (projectPage - 1) * PAGE_SIZE,
    projectPage * PAGE_SIZE
  )

  return (
    <div className='grid gap-5 lg:grid-cols-2'>
      <Card className='h-fit gap-0 py-0'>
        <CardHeader className='border-b p-5'>
          <CardTitle>Equipes</CardTitle>
          <CardDescription>
            Equipes das quais o usuário participa atualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {!visibleTeams.length ? (
            <EmptyState>Nenhuma equipe vinculada.</EmptyState>
          ) : (
            <div className='divide-y p-1'>
              {visibleTeams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className='flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted last:rounded-b-lg'
                >
                  <div className='min-w-0'>
                    <p className='font-medium'>{team.name}</p>
                    {team.description && (
                      <p className='truncate text-xs text-muted-foreground'>
                        {team.description}
                      </p>
                    )}
                  </div>
                  <Badge variant='outline' className='text-[10px]'>
                    {teamRoleLabels[team.role]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
          <Pagination
            page={teamPage}
            totalPages={teamPages}
            onPageChange={setTeamPage}
          />
        </CardContent>
      </Card>

      <Card className='h-fit gap-0 py-0'>
        <CardHeader className='border-b p-5'>
          <CardTitle>Projetos</CardTitle>
          <CardDescription>
            Projetos atribuídos às equipes do usuário.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {!visibleProjects.length ? (
            <EmptyState>Nenhum projeto vinculado.</EmptyState>
          ) : (
            <div className='divide-y px-1'>
              {visibleProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className='flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted last:mb-1 last:rounded-b-lg'
                >
                  <span className='font-medium'>{project.name}</span>
                  <StatusBadge value={projectStatusLabel(project.status)} />
                </Link>
              ))}
            </div>
          )}
          <Pagination
            page={projectPage}
            totalPages={projectPages}
            onPageChange={setProjectPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className='p-6 text-center text-sm text-muted-foreground'>{children}</p>
  )
}
