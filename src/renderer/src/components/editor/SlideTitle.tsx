import React, { useState, useRef, useEffect } from 'react'
import { useSlidesStore } from '@renderer/store/editor-slides'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { Check, X, Edit } from 'lucide-react'

interface SlideTitleProps {
  slideIndex: number
  className?: string
}

export const SlideTitle: React.FC<SlideTitleProps> = ({ slideIndex, className = '' }) => {
  const { slides, updateSlideTitle } = useSlidesStore()
  const [isEditing, setIsEditing] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const slide = slides[slideIndex]

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const startEditing = (): void => {
    setTempTitle(slide?.title || '')
    setIsEditing(true)
  }

  const cancelEditing = (): void => {
    setIsEditing(false)
    setTempTitle('')
  }

  const saveTitle = (): void => {
    if (tempTitle.trim() && slide) {
      updateSlideTitle(slideIndex, tempTitle.trim())
    }
    setIsEditing(false)
    setTempTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      saveTitle()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  if (!slide) return null

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          ref={inputRef}
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm"
          placeholder="Slide title..."
        />
        <Button
          onClick={saveTitle}
          size="sm"
          variant="ghost"
          className="w-6 h-6 p-0 text-green-600 hover:text-green-500"
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          onClick={cancelEditing}
          size="sm"
          variant="ghost"
          className="w-6 h-6 p-0 text-destructive hover:text-destructive/80"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <span className="font-medium text-sm">{slide.title}</span>
      <Button
        onClick={startEditing}
        size="sm"
        variant="ghost"
        className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit className="w-3 h-3" />
      </Button>
    </div>
  )
}
