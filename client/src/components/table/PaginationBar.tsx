import Pagination from 'react-bootstrap/Pagination'

type Props = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function PaginationBar({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <Pagination className="mt-3">
      <Pagination.First disabled={prevDisabled} onClick={() => onPageChange(1)} />
      <Pagination.Prev disabled={prevDisabled} onClick={() => onPageChange(page - 1)} />
      <Pagination.Item active>{page}</Pagination.Item>
      <Pagination.Next disabled={nextDisabled} onClick={() => onPageChange(page + 1)} />
      <Pagination.Last disabled={nextDisabled} onClick={() => onPageChange(totalPages)} />
    </Pagination>
  )
}