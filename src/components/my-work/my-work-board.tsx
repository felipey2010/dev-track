'use client'

import { StatusBadge } from '@/components/ui'
import { ListFilter } from '@/components/list-filter'
import { Metric, MetricStrip } from '@/components/metric-strip'
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
      <MetricStrip>
        <Metric
          label='Atribuídos a mim'
          value={assigned.length}
          note='Itens sob sua responsabilidade'
          tone='primary'
        />
        <Metric
          label='Atrasados'
          value={overdue.length}
          tone={overdue.length > 0 ? 'destructive' : 'default'}
          note={
            overdue.length ? 'Itens que exigem atenção' : 'Nenhum item crítico'
          }
        />
        <Metric
          label='Próximos 7 dias'
          value={dueSoon.length}
          note={
            dueSoon.length ? 'Vencimentos próximos' : 'Sem vencimentos próximos'
          }
        />
        <Metric
          label='Disponíveis para assumir'
          value={items.filter((item) => item.kind === 'AVAILABLE').length}
          note='Itens aguardando responsável'
          tone='amber'
        />
      </MetricStrip>

      <div className='mb-5 grid gap-3 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem]'>
        <label className='relative'>
          <span className='sr-only'>Buscar trabalho</span>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Buscar requisito ou projeto'
            className='h-12 rounded-[10px] bg-card pl-10'
          />
        </label>
        <ListFilter value={scope} onChange={setScope} label='Responsabilidade'>
          <option value='ALL'>Todos</option>
          <option value='ASSIGNED'>Atribuídos a mim</option>
          <option value='AVAILABLE'>Disponíveis</option>
        </ListFilter>
        <ListFilter value={status} onChange={setStatus} label='Etapa'>
          <option value='ALL'>Todas as etapas</option>
          <option value='REQUIREMENTS'>Requisitos</option>
          <option value='DEVELOPMENT'>Desenvolvimento</option>
          <option value='TESTING'>Testes</option>
        </ListFilter>
      </div>

      {!filtered.length ? (
        <div className='rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground'>
          Nenhum trabalho corresponde aos filtros selecionados.
        </div>
      ) : (
        <div className='grid gap-3.5 lg:grid-cols-2'>
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
    <Link
      href={`/projects/${item.project.id}/requirements/${item.id}`}
      className='group rounded-xl'
    >
      <Card className='gap-0 py-0 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg'>
        <CardContent className='p-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <p className='font-mono text-[11px] text-primary'>
                {item.code} · {item.project.name}
              </p>
              <span className='mt-1.5 block truncate text-[15px] font-semibold'>
                {item.title}
              </span>
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
    </Link>
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
