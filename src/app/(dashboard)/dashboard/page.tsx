'use client'
import { Progress, ProjectLink, StatusBadge } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dateLabel, dateTimeLabel, projectStatusLabel } from '@/lib/format'
import { PROJECT_STATUS } from '@/lib/projects/constants'
import type { Activity, Project, Team } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  FlaskConical,
  FolderKanban,
} from 'lucide-react'

export default function Dashboard() {
  const projects = useApi<Project[]>('projects', '/api/projects')
  const activity = useApi<Activity[]>('activity', '/api/activity')
  const teams = useApi<Team[]>('teams', '/api/teams')
  const rows = projects.data ?? []
  const counts = {
    development: rows.filter((p) => p.status === PROJECT_STATUS.IN_DEVELOPMENT)
      .length,
    testing: rows.filter((p) => p.status === PROJECT_STATUS.TESTING).length,
    completed: rows.filter((p) => p.status === PROJECT_STATUS.COMPLETED).length,
  }
  const warnings =
    teams.data?.filter((t) => !t.users || t.users.status !== 'ACTIVE') ?? []

  return (
    <div className='mx-auto max-w-7xl'>
      <div className='mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Painel</h1>
          <p className='mt-1 text-xs text-muted-foreground'>
            Visão geral dos projetos de software da empresa.
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <span className='hidden items-center gap-2 font-mono text-[10px] text-muted-foreground lg:flex'>
            <i className='size-2 animate-pulse rounded-full bg-emerald-500' />
            Dados atualizados do banco
          </span>
        </div>
      </div>
      <section className='mb-7 grid overflow-hidden rounded-md border bg-card sm:grid-cols-2 lg:grid-cols-4'>
        <Metric
          icon={<FolderKanban />}
          label='Total de projetos'
          value={rows.length}
          note={`${teams.data?.length ?? 0} equipes cadastradas`}
        />
        <Metric
          icon={<CircleDot />}
          label='Em desenvolvimento'
          value={counts.development}
          note={percentage(counts.development, rows.length)}
        />
        <Metric
          icon={<FlaskConical />}
          label='Em teste'
          value={counts.testing}
          note={percentage(counts.testing, rows.length)}
        />
        <Metric
          icon={<CheckCircle2 />}
          label='Concluídos'
          value={counts.completed}
          note={percentage(counts.completed, rows.length)}
        />
      </section>
      <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <Card className='gap-0 overflow-hidden py-0'>
          <CardHeader className='border-b py-4'>
            <CardTitle className='text-sm'>
              Projetos{' '}
              <span className='ml-2 font-normal text-muted-foreground'>
                {rows.length} no total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {projects.isLoading ? (
              <Loading />
            ) : projects.error ? (
              <State text={projects.error.message} error />
            ) : !rows.length ? (
              <State text='Nenhum projeto cadastrado.' />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Entrega prevista</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 8).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <ProjectLink id={p.id}>{p.name}</ProjectLink>
                        <span className='mt-1 block text-[10px] text-muted-foreground'>
                          Cliente: {p.client ?? 'Não informado'}
                        </span>
                      </TableCell>
                      <TableCell className='text-xs'>{p.team.name}</TableCell>
                      <TableCell>
                        <StatusBadge value={projectStatusLabel(p.status)} />
                      </TableCell>
                      <TableCell>
                        <Progress value={p.progress} />
                      </TableCell>
                      <TableCell className='font-mono text-[10px] text-muted-foreground'>
                        {dateLabel(p.expected_completion_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <aside className='flex flex-col gap-4'>
          <Card className='gap-0 py-0'>
            <CardHeader className='border-b py-4'>
              <CardTitle className='text-sm'>Avisos</CardTitle>
            </CardHeader>
            <CardContent className='p-4'>
              {teams.isLoading ? (
                <Skeleton className='h-24' />
              ) : !warnings.length ? (
                <p className='text-xs text-muted-foreground'>
                  Nenhum aviso no momento.
                </p>
              ) : (
                warnings.map((team) => (
                  <div
                    key={team.id}
                    className='rounded-md border border-amber-500/20 bg-amber-500/5 p-3'
                  >
                    <div className='flex gap-2'>
                      <AlertTriangle className='mt-0.5 size-4 shrink-0 text-amber-500' />
                      <div>
                        <strong className='text-xs'>
                          Equipe {team.name} sem líder ativo
                        </strong>
                        <p className='mt-1 text-[11px] leading-5 text-muted-foreground'>
                          Novos projetos não podem ser atribuídos até a
                          definição de uma liderança ativa.
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className='gap-0 py-0'>
            <CardHeader className='border-b py-4'>
              <CardTitle className='text-sm'>Atividade recente</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              {activity.isLoading ? (
                <Loading />
              ) : activity.error ? (
                <State text={activity.error.message} error />
              ) : !activity.data?.length ? (
                <State text='Nenhuma atividade registrada.' />
              ) : (
                activity.data.map((item) => (
                  <div key={item.id} className='border-b p-4 last:border-0'>
                    <p className='text-xs leading-5'>
                      <span className='font-semibold'>
                        {item.actor_name_snapshot ?? 'Sistema'}
                      </span>{' '}
                      {item.action.toLowerCase()}
                    </p>
                    <span className='mt-1 block font-mono text-[9px] text-muted-foreground'>
                      {dateTimeLabel(item.created_at)} · {item.entity_type}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode
  label: string
  value: number
  note: string
}) {
  return (
    <div className='border-b p-5 last:border-0 sm:border-b-0 sm:border-r'>
      <div className='flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground'>
        <span className='text-cyan-500 [&>svg]:size-3'>{icon}</span>
        {label}
      </div>
      <strong className='mt-4 block text-2xl'>{value}</strong>
      <span className='mt-2 block text-[10px] text-muted-foreground'>
        {note}
      </span>
    </div>
  )
}

function percentage(value: number, total: number) {
  return total
    ? `${Math.round((value / total) * 100)}% dos projetos`
    : 'Nenhum projeto'
}

function Loading() {
  return (
    <div className='flex flex-col gap-2 p-4'>
      <Skeleton className='h-10' />
      <Skeleton className='h-10' />
    </div>
  )
}
function State({ text, error }: { text: string; error?: boolean }) {
  return (
    <div
      className={`p-6 text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {text}
    </div>
  )
}
