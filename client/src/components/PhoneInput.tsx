import Form from 'react-bootstrap/Form'
import type { ChangeEvent } from 'react'

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function PhoneInput({ id, value, onChange, placeholder = '(555) 123-4567', className, required }: Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = formatPhone(e.target.value)
    onChange(next)
  }

  return (
    <>
      <Form.Control
        id={id}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        required={required}
      />
      <Form.Text className="text-muted">Automatically formats to (###) ###-####</Form.Text>
    </>
  )
}

export default PhoneInput
