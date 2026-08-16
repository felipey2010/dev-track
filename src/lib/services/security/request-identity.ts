import 'server-only'

export function requestIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const real = headers.get('x-real-ip')?.trim()
  const value = forwarded || real
  return value && /^[0-9a-fA-F:.]{3,45}$/.test(value) ? value : 'unknown'
}
