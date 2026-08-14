import Image from 'next/image'

export function AuthBrand() {
  return (
    <div className='flex items-center justify-center gap-3'>
      <Image
        src='/assets/images/logo.png'
        alt='Dev Track'
        width={50}
        height={50}
      />
      <div>
        <strong className='block text-base'>Dev Track</strong>
        <span className='font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground'>
          Engenharia · Interno
        </span>
      </div>
    </div>
  )
}
