'use client'

import ReactDatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

type DatePickerProps = {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholderText?: string
  className?: string
}

export function DatePicker({ selected, onChange, placeholderText, className }: DatePickerProps) {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      placeholderText={placeholderText}
      className={className}
      dateFormat="dd/MM/yyyy"
      isClearable
    />
  )
} 