import Image from 'next/image'
import Link from 'next/link'
import { APP_IDENTITY } from '@/lib/app-identity'

export function AuthBrand() {
  return (
    <div className='flex items-center justify-center gap-3'>
      <Link href='/'>
        <Image
          src={APP_IDENTITY.logoPath}
          alt={APP_IDENTITY.name}
          width={64}
          height={64}
        />
      </Link>
      <div>
        <strong className='block text-base'>{APP_IDENTITY.name}</strong>
        <span className='font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground'>
          {APP_IDENTITY.subtitle}
        </span>
      </div>
    </div>
  )
}
