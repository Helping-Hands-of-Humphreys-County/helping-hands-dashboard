import Button from 'react-bootstrap/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons'
import type { SortState } from './sortTypes'
import { nextSortForKey } from './sortTypes'

export function SortableTh({
  label,
  sortKey,
  sort,
  onSortChange,
}: {
  label: string
  sortKey: string
  sort: SortState
  onSortChange: (next: SortState) => void
}) {
  const isActive = sort.key === sortKey && sort.dir !== null

  const icon = !isActive ? faSort : sort.dir === 'asc' ? faSortUp : faSortDown

  return (
    <th>
      <Button
        variant="link"
        className="p-0 text-decoration-none"
        onClick={() => onSortChange(nextSortForKey(sort, sortKey))}
      >
        <span className="me-2">{label}</span>
        <FontAwesomeIcon icon={icon} />
      </Button>
    </th>
  )
}
