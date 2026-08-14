import { Label } from '../ui/label'

export default function AuthField({
  label,
  aside,
  children,
}: {
  label: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <Label className='text-xs'>{label}</Label>
        {aside}
      </div>
      {children}
    </div>
  )
}
