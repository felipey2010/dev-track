import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  ).filter(
    (item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1
  )

  return (
    <nav
      className='flex items-center justify-end gap-1 border-t p-3'
      aria-label='Paginação'
    >
      <Button
        type='button'
        variant='outline'
        size='icon-sm'
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label='Página anterior'
      >
        <ChevronLeft />
      </Button>
      {pages.map((item, index) => (
        <span key={item} className='contents'>
          {index > 0 && item - pages[index - 1] > 1 && (
            <span className='px-1 text-xs text-muted-foreground'>…</span>
          )}
          <Button
            type='button'
            variant={item === page ? 'default' : 'outline'}
            size='icon-sm'
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </Button>
        </span>
      ))}
      <Button
        type='button'
        variant='outline'
        size='icon-sm'
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label='Próxima página'
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}
