import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { Grid3X3, List } from 'lucide-react'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
}

export function ViewToggle({ view, onViewChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex items-center border rounded-lg p-1 bg-muted/30 ${className}`}>
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="h-7 px-2"
      >
        <Grid3X3 className="w-4 h-4" />
        <span className="sr-only">Grid view</span>
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="h-7 px-2"
      >
        <List className="w-4 h-4" />
        <span className="sr-only">List view</span>
      </Button>
    </div>
  )
}