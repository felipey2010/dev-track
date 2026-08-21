import Image from 'next/image'
import Link from 'next/link'
import { APP_IDENTITY } from '@/lib/app-identity'

export function AuthBrand() {
  return (
    <div className='mb-9 flex items-center justify-center gap-3.5'>
      <Link
        href='/'
        className='grid size-12 place-items-center overflow-hidden rounded-xl border border-border bg-secondary shadow-inner'
      >
        <Image
          src={APP_IDENTITY.logoPath}
          alt={APP_IDENTITY.name}
          width={36}
          height={36}
        />
      </Link>
      <div>
        <strong className='block text-lg font-bold tracking-tight'>
          {APP_IDENTITY.name}
        </strong>
        <span className='mt-0.5 block font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground'>
          {APP_IDENTITY.subtitle}
        </span>
      </div>
    </div>
  )
}
