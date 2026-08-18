'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang='pt-BR'>
      <body className='min-h-dvh bg-slate-950 text-slate-100'>
        <main className='flex min-h-dvh items-center justify-center px-4 py-12'>
          <div className='w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl sm:p-12'>
            <div className='mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-rose-500/15 text-rose-300'>
              <AlertTriangle className='size-8' aria-hidden='true' />
            </div>
            <p className='font-mono text-xs uppercase tracking-[0.25em] text-rose-300'>
              Erro inesperado
            </p>
            <h1 className='mt-3 text-3xl font-semibold sm:text-4xl'>
              Algo deu errado
            </h1>
            <p className='mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400'>
              Não foi possível carregar esta página. Tente novamente ou volte
              ao início.
            </p>
            {error.digest ? (
              <p className='mt-5 text-xs text-slate-500'>
                Referência: {error.digest}
              </p>
            ) : null}
            <div className='mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
              <button
                type='button'
                onClick={reset}
                className='rounded-md bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300'
              >
                Tentar novamente
              </button>
              <Link
                href='/'
                className='rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold transition hover:border-slate-500 hover:bg-slate-800'
              >
                Ir para o início
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
