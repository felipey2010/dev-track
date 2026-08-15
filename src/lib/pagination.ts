export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

export type PaginatedData<T> = {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export function getPagination(request: Request) {
  const parameters = new URL(request.url).searchParams
  const requestedPage = Number(parameters.get('page') ?? '1')
  const requestedPageSize = Number(
    parameters.get('pageSize') ?? DEFAULT_PAGE_SIZE
  )
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE
  return { page, pageSize, skip: (page - 1) * pageSize }
}

export function paginated<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number
): PaginatedData<T> {
  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  }
}
