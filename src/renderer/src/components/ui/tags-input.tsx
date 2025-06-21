import { useState, KeyboardEvent } from 'react'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

interface TagsInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagsInput({
  tags,
  onTagsChange,
  placeholder = 'Add tags...',
  className
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag])
    }
    setInputValue('')
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag when backspacing on empty input
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 p-3 border rounded-md bg-background min-h-[36px]',
        className
      )}
    >
      {/* Render existing tags */}
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md"
        >
          {tag}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-3 w-3 p-0 hover:bg-primary-foreground/20"
            onClick={() => removeTag(tag)}
          >
            <X className="h-2 w-2" />
          </Button>
        </span>
      ))}

      {/* Input for new tags */}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] border-none bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        onBlur={() => {
          if (inputValue.trim()) {
            addTag(inputValue)
          }
        }}
      />
    </div>
  )
}
