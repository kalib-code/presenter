import React, { useState, useEffect } from 'react'
import { Input } from './input'
import {
  parseTimeToSeconds,
  formatTimeFromSeconds,
  isValidTimeFormat
} from '@renderer/lib/time-utils'
import { cn } from '@renderer/lib/utils'

interface TimeInputProps {
  value?: number // value in seconds
  onChange?: (seconds: number) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
  'aria-label'?: string
}

export function TimeInput({
  value = 0,
  onChange,
  placeholder = 'e.g., 5min, 3:30, 1h30m',
  className,
  id,
  disabled,
  'aria-label': ariaLabel
}: TimeInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isValid, setIsValid] = useState(true)

  // Update input value when prop value changes
  useEffect(() => {
    if (value > 0) {
      setInputValue(formatTimeFromSeconds(value))
    } else {
      setInputValue('')
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Validate and parse the input
    const valid = !newValue || isValidTimeFormat(newValue)
    setIsValid(valid)

    if (valid && onChange) {
      const seconds = parseTimeToSeconds(newValue)
      onChange(seconds)
    }
  }

  const handleBlur = () => {
    // On blur, try to format the input to a standard format if valid
    if (inputValue && isValidTimeFormat(inputValue)) {
      const seconds = parseTimeToSeconds(inputValue)
      setInputValue(formatTimeFromSeconds(seconds))
      if (onChange) {
        onChange(seconds)
      }
    }
  }

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn('font-mono', !isValid && 'border-red-500 focus:border-red-500', className)}
      />
      {!isValid && (
        <div className="text-xs text-red-500">
          Invalid time format. Try: 5min, 3:30, 1h30m, or 00:05:30
        </div>
      )}
      {isValid && inputValue && (
        <div className="text-xs text-muted-foreground">
          Parsed as: {formatTimeFromSeconds(parseTimeToSeconds(inputValue))}
        </div>
      )}
    </div>
  )
}
