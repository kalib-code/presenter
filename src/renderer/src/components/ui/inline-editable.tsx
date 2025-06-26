import React, { useState, useEffect, useRef } from 'react'
import { Input } from './input'
import { Textarea } from './textarea'
import { cn } from '@renderer/lib/utils'
import { Check, X, Edit2 } from 'lucide-react'
import { Button } from './button'

interface InlineEditableTextProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  maxLength?: number
  disabled?: boolean
  emptyText?: string
  showEditIcon?: boolean
}

export function InlineEditableText({
  value,
  onSave,
  placeholder = 'Click to edit...',
  className,
  multiline = false,
  maxLength,
  disabled = false,
  emptyText = 'Click to add...',
  showEditIcon = false
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      } else {
        // For textarea, select all text
        inputRef.current.setSelectionRange(0, inputRef.current.value.length)
      }
    }
  }, [isEditing])

  const handleStartEdit = () => {
    if (!disabled) {
      setIsEditing(true)
      setEditValue(value)
    }
  }

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleBlur = () => {
    // Don't auto-save on blur, let user explicitly save or cancel
    // This prevents accidental saves when clicking elsewhere
  }

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input

    return (
      <div className="flex items-center gap-2">
        <InputComponent
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn('flex-1', className)}
          rows={multiline ? 3 : undefined}
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group inline-flex items-center gap-2 cursor-pointer hover:text-primary transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        !value && 'text-muted-foreground italic',
        className
      )}
      onClick={handleStartEdit}
      title="Click to edit"
    >
      <span className="flex-1 truncate">{value || emptyText}</span>
      {showEditIcon && (
        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </div>
  )
}

interface InlineEditableNumberProps {
  value: number
  onSave: (value: number) => void
  formatter?: (value: number) => string
  parser?: (value: string) => number
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
}

export function InlineEditableNumber({
  value,
  onSave,
  formatter = (v) => v.toString(),
  parser = (v) => parseFloat(v) || 0,
  placeholder = 'Click to edit...',
  className,
  disabled = false,
  min,
  max,
  step
}: InlineEditableNumberProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(formatter(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(formatter(value))
  }, [value, formatter])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    if (!disabled) {
      setIsEditing(true)
      setEditValue(formatter(value))
    }
  }

  const handleSave = () => {
    const parsedValue = parser(editValue)
    if (!isNaN(parsedValue) && parsedValue !== value) {
      // Apply min/max constraints
      let finalValue = parsedValue
      if (min !== undefined) finalValue = Math.max(min, finalValue)
      if (max !== undefined) finalValue = Math.min(max, finalValue)

      onSave(finalValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(formatter(value))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn('flex-1 font-mono', className)}
          min={min}
          max={max}
          step={step}
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'cursor-pointer hover:text-primary hover:underline transition-colors font-mono',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleStartEdit}
      title="Click to edit"
    >
      {formatter(value)}
    </div>
  )
}
