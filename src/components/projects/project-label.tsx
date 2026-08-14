import { Label } from '../ui/label'

export default function ProjectField({
  label,
  htmlFor,
  error,
  wide,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={wide ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  )
}
