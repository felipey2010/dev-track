export default function AuthHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h1 className='text-xl font-bold tracking-[-.01em]'>{title}</h1>
      <p className='mt-1.5 text-[13px] leading-5 text-muted-foreground'>
        {description}
      </p>
    </div>
  )
}
