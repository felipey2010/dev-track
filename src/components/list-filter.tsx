'use client'

export function ListFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label>
      <span className='sr-only'>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='h-12 w-full rounded-[10px] border bg-card px-4 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        {children}
      </select>
    </label>
  )
}
