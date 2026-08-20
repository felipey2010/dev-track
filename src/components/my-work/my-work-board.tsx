'use client'

import { StatusBadge } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { dateLabel, requirementStatusLabel } from '@/lib/format'
import type { MyWorkItem } from '@/lib/services/my-work'
import { AlertTriangle, CalendarClock, RotateCcw, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const priorityLabels = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
} as const

export function MyWorkBoard({ items }: { items: MyWorkItem[] }) {
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const today = startOfToday()
  const nextWeek = new Date(today)
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7)

  const term = search.trim().toLocaleLowerCase('pt-BR')
  const filtered = items.filter((item) => {
    const matchesSearch =
      !term ||
      `${item.code} ${item.title} ${item.project.name}`
        .toLocaleLowerCase('pt-BR')
        .includes(term)
    const matchesScope = scope === 'ALL' || item.kind === scope
    const matchesStatus = status === 'ALL' || item.status === status
    return matchesSearch && matchesScope && matchesStatus
  })

  const assigned = items.filter((item) => item.kind === 'ASSIGNED')
  const overdue = assigned.filter(
    (item) => deadlineState(item.deadline, today) === 'OVERDUE'
  )
  const dueSoon = assigned.filter((item) => {
    const deadline = item.deadline ? new Date(item.deadline) : null
    return deadline && deadline >= today && deadline <= nextWeek
  })

  return (
    <>
      <section className='mb-6 grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 lg:grid-cols-4'>
        <Metric label='Atribuídos a mim' value={assigned.length} />
        <Metric
          label='Atrasados'
          value={overdue.length}
          alert={overdue.length > 0}
        />
        <Metric label='Próximos 7 dias' value={dueSoon.length} />
        <Metric
          label='Disponíveis para assumir'
          value={items.filter((item) => item.kind === 'AVAILABLE').length}
        />
      </section>

      <div className='mb-5 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem]'>
        <label className='relative'>
          <span className='sr-only'>Buscar trabalho</span>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Buscar requisito ou projeto'
            className='pl-9'
          />
        </label>
        <Filter value={scope} onChange={setScope} label='Responsabilidade'>
          <option value='ALL'>Todos</option>
          <option value='ASSIGNED'>Atribuídos a mim</option>
          <option value='AVAILABLE'>Disponíveis</option>
        </Filter>
        <Filter value={status} onChange={setStatus} label='Etapa'>
          <option value='ALL'>Todas as etapas</option>
          <option value='REQUIREMENTS'>Requisitos</option>
          <option value='DEVELOPMENT'>Desenvolvimento</option>
          <option value='TESTING'>Testes</option>
        </Filter>
      </div>

      {!filtered.length ? (
        <div className='rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground'>
          Nenhum trabalho corresponde aos filtros selecionados.
        </div>
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          {filtered.map((item) => (
            <WorkCard key={item.id} item={item} today={today} />
          ))}
        </div>
      )}
    </>
  )
}

function WorkCard({ item, today }: { item: MyWorkItem; today: Date }) {
  const deadline = deadlineState(item.deadline, today)
  return (
    <Card className='gap-0 py-0 transition-colors hover:border-cyan-500/40'>
      <CardContent className='p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0'>
            <p className='font-mono text-[10px] text-cyan-600 dark:text-cyan-400'>
              {item.code} · {item.project.name}
            </p>
            <Link
              href={`/projects/${item.project.id}/requirements/${item.id}`}
              className='mt-1 block truncate font-semibold hover:text-cyan-600'
            >
              {item.title}
            </Link>
            <p className='mt-1 text-xs text-muted-foreground'>
              {item.team.name}
            </p>
          </div>
          <StatusBadge value={requirementStatusLabel(item.status)} />
        </div>
        <div className='mt-5 flex flex-wrap items-center gap-2'>
          <Badge variant='outline'>{priorityLabels[item.priority]}</Badge>
          <Badge variant={item.kind === 'ASSIGNED' ? 'default' : 'secondary'}>
            {item.kind === 'ASSIGNED' ? 'Atribuído a mim' : 'Disponível'}
          </Badge>
          {item.returnedFromTesting && item.status === 'DEVELOPMENT' && (
            <Badge variant='outline' className='gap-1 text-amber-600'>
              <RotateCcw className='size-3' /> Devolvido pelo teste
            </Badge>
          )}
          {item.deadline && (
            <span
              className={`ml-auto flex items-center gap-1 text-xs ${deadline === 'OVERDUE' ? 'font-medium text-red-600' : 'text-muted-foreground'}`}
            >
              {deadline === 'OVERDUE' ? (
                <AlertTriangle className='size-3.5' />
              ) : (
                <CalendarClock className='size-3.5' />
              )}
              {deadline === 'OVERDUE' ? 'Atrasado · ' : ''}
              {dateLabel(item.deadline)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({
  label,
  value,
  alert = false,
}: {
  label: string
  value: number
  alert?: boolean
}) {
  return (
    <div className='border-b p-5 last:border-0 sm:border-r lg:border-b-0'>
      <span className='text-[10px] uppercase tracking-wider text-muted-foreground'>
        {label}
      </span>
      <strong className={`mt-2 block text-2xl ${alert ? 'text-red-600' : ''}`}>
        {value}
      </strong>
    </div>
  )
}

function Filter({
  value,
  onChange,
  label,
  children,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <label>
      <span className='sr-only'>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        {children}
      </select>
    </label>
  )
}

function startOfToday() {
  const now = new Date()
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
}

function deadlineState(value: string | null, today: Date) {
  if (!value) return 'NONE'
  return new Date(value) < today ? 'OVERDUE' : 'ACTIVE'
}
