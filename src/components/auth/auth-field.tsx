import { Label } from '../ui/label'

export default function AuthField({
  label,
  htmlFor,
  error,
  aside,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <Label htmlFor={htmlFor} className='text-xs'>
          {label}
        </Label>
        {aside}
      </div>
      {children}
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  )
}
