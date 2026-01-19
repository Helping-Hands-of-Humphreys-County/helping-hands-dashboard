import type { ReactNode, FormEventHandler } from 'react'
import Form from 'react-bootstrap/Form'
import Stack from 'react-bootstrap/Stack'
import Button from 'react-bootstrap/Button'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  onSearchClear?: () => void
  children?: ReactNode
  placeholder?: string
}

export function TableToolbar({ search, onSearchChange, onSearchClear, children, placeholder }: Props) {
  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
  }

  return (
    <Form onSubmit={handleSubmit} className="mb-3">
      <Stack direction="horizontal" gap={2}>
        <Form.Control
          type="search"
          placeholder={placeholder ?? 'Search'}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {onSearchClear ? (
          <Button variant="outline-secondary" onClick={onSearchClear} disabled={!search}>
            Clear
          </Button>
        ) : null}
        <div className="ms-auto d-flex align-items-center gap-2">{children}</div>
      </Stack>
    </Form>
  )
}