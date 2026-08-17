import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { DEFAULT_PAGE } from '@/lib/pagination'

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= DEFAULT_PAGE) return null

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + DEFAULT_PAGE
  ).filter(
    (item) =>
      item === DEFAULT_PAGE ||
      item === totalPages ||
      Math.abs(item - page) <= DEFAULT_PAGE
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
        disabled={page === DEFAULT_PAGE}
        onClick={() => onPageChange(page - DEFAULT_PAGE)}
        aria-label='Página anterior'
      >
        <ChevronLeft />
      </Button>
      {pages.map((item, index) => (
        <span key={item} className='contents'>
          {index > 0 && item - pages[index - DEFAULT_PAGE] > DEFAULT_PAGE && (
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
        onClick={() => onPageChange(page + DEFAULT_PAGE)}
        aria-label='Próxima página'
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}
