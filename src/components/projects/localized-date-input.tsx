'use client'

import { buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

export function LocalizedDateInput({
  value,
  onChange,
  id,
  required,
}: {
  value: string
  onChange: (value: string) => void
  id: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = toCalendarDate(value)
  const displayValue = toPortugueseDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type='button'
        aria-required={required}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-full justify-between text-left font-normal',
          !displayValue && 'text-muted-foreground'
        )}
      >
        <span>
          {selectedDate
            ? format(selectedDate, 'PPPP', { locale: ptBR })
            : 'dd/mm/aaaa'}
        </span>
        <CalendarIcon aria-hidden='true' />
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          id={'calendar-' + id}
          mode='single'
          selected={selectedDate}
          onSelect={(date) => {
            onChange(date ? toIsoDate(date) : '')
            setOpen(false)
          }}
          defaultMonth={selectedDate}
          captionLayout='dropdown'
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
}

function toCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function toPortugueseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
