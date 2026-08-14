import { NextResponse } from 'next/server'
import { fail, ok } from '@/lib/api'
import { ApplicationError } from '@/server/errors/application-error'

export function apiSuccess<T>(message: string, data: T, status = 200) {
  return NextResponse.json(ok(message, data), { status })
}

export function apiError(
  error: unknown,
  fallback = 'Não foi possível concluir a operação.'
) {
  if (error instanceof ApplicationError) {
    return NextResponse.json(fail(error.message), { status: error.status })
  }
  console.error(error)
  return NextResponse.json(fail(fallback), { status: 500 })
}
