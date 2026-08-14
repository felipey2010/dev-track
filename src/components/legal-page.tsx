export function LegalPage({
  title,
  description,
  updatedDate,
  children,
}: {
  title: string
  description: string
  updatedDate: string
  children: React.ReactNode
}) {
  return (
    <main className='mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14'>
      <div className='border-b pb-7'>
        <span className='text-[10px] font-bold tracking-[.16em] text-primary'>
          DOCUMENTO LEGAL
        </span>
        <h1 className='mt-2 text-3xl font-semibold tracking-tight'>{title}</h1>
        <p className='mt-3 text-sm leading-6 text-muted-foreground'>
          {description}
        </p>
        <small className='mt-3 block text-[10px] text-muted-foreground'>
          {updatedDate}
        </small>
      </div>
      <article className='mt-6 rounded-lg border bg-card px-6 py-3 text-sm leading-7 text-muted-foreground [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mb-3 [&_section]:border-b [&_section]:py-5 [&_section:last-child]:border-0'>
        {children}
      </article>
    </main>
  )
}
