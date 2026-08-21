'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function ListSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className='relative w-full'>
      <Search
        aria-hidden='true'
        className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
      />
      <Input
        type='search'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className='h-12 rounded-[10px] border-border bg-card pl-10 text-sm shadow-none'
      />
    </div>
  )
}
