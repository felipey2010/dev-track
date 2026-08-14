export default function AuthHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h1 className='text-lg font-semibold'>{title}</h1>
      <p className='mt-1 text-xs leading-5 text-muted-foreground'>
        {description}
      </p>
    </div>
  )
}
