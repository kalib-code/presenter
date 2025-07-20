import React, { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { Badge } from '@renderer/components/ui/badge'
import { Separator } from '@renderer/components/ui/separator'
import {
  Edit,
  Trash2,
  Copy,
  Save,
  X,
  Music,
  Presentation,
  Timer,
  Video,
  Image,
  Volume2,
  MessageSquare,
  Clock,
  FileText
} from 'lucide-react'
import { InlineEditableText, InlineEditableNumber } from '@renderer/components/ui/inline-editable'
import type { SetlistItem } from '@renderer/types/database'
import {
  parseTimeToSeconds,
  formatTimeFromSeconds
} from '@renderer/lib/time-utils'

interface ItemDetailsPanelProps {
  item: SetlistItem | null
  onEdit: (item: SetlistItem) => void
  onDelete: (itemId: string) => void
  onUpdateTitle: (itemId: string, title: string) => void
  onUpdateDuration: (itemId: string, duration: number) => void
  onUpdateNotes: (itemId: string, notes: string) => void
  className?: string
}

export function ItemDetailsPanel({
  item,
  onEdit,
  onDelete,
  onUpdateTitle,
  onUpdateDuration,
  onUpdateNotes,
  className = ''
}: ItemDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song':
        return <Music className="w-5 h-5 text-blue-600" />
      case 'presentation':
        return <Presentation className="w-5 h-5 text-green-600" />
      case 'video':
        return <Video className="w-5 h-5 text-red-600" />
      case 'image':
        return <Image className="w-5 h-5 text-yellow-600" />
      case 'audio':
        return <Volume2 className="w-5 h-5 text-purple-600" />
      case 'countdown':
        return <Timer className="w-5 h-5 text-red-600" />
      case 'announcement':
        return <MessageSquare className="w-5 h-5 text-orange-600" />
      default:
        return <Music className="w-5 h-5 text-muted-foreground" />
    }
  }

  const handleStartEdit = () => {
    if (!item) return
    setEditTitle(item.title)
    setEditNotes(item.notes || '')
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!item) return
    onUpdateTitle(item.id, editTitle)
    onUpdateNotes(item.id, editNotes)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle('')
    setEditNotes('')
  }

  if (!item) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Item Details</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select an item to view details</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Item Details</h3>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  className="h-7 px-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="h-7 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-7 px-2 text-green-600 hover:text-green-700"
                >
                  <Save className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Item Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50">
              {getItemIcon(item.type)}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-medium"
                  placeholder="Item title..."
                />
              ) : (
                <h4 className="font-medium text-lg">{item.title}</h4>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {item.type}
                </Badge>
                {item.isActive && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Properties */}
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Properties
            </Label>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="duration" className="text-sm font-medium">
                Duration
              </Label>
            </div>
            <div className="text-sm font-mono bg-muted/30 px-3 py-2 rounded-lg">
              <InlineEditableNumber
                value={item.duration || 0}
                onSave={(duration) => onUpdateDuration(item.id, duration)}
                formatter={formatTimeFromSeconds}
                parser={parseTimeToSeconds}
                className="text-sm font-mono"
                placeholder="0:00:00"
                min={0}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
            </div>
            {isEditing ? (
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this item..."
                rows={4}
                className="resize-none"
              />
            ) : (
              <div className="text-sm bg-muted/30 px-3 py-2 rounded-lg min-h-[80px]">
                {item.notes || (
                  <span className="text-muted-foreground">No notes added</span>
                )}
              </div>
            )}
          </div>

          {/* Item-specific properties */}
          {item.type === 'countdown' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Countdown Settings</Label>
              </div>
              <div className="space-y-2 text-sm">
                {item.countdownDuration && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timer Duration:</span>
                    <span className="font-mono">
                      {formatTimeFromSeconds(item.countdownDuration)}
                    </span>
                  </div>
                )}
                {item.countdownMessage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Message:</span>
                    <span className="truncate ml-2">{item.countdownMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(item.type === 'video' || item.type === 'audio' || item.type === 'image') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getItemIcon(item.type)}
                <Label className="text-sm font-medium">Media Settings</Label>
              </div>
              <div className="space-y-2 text-sm">
                {item.referenceId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Reference:</span>
                    <span className="truncate ml-2 font-mono text-xs">
                      {item.referenceId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        {!isEditing && (
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
                className="flex-1"
              >
                <Edit className="w-3 h-3 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Implement duplicate */}}
                className="flex-1"
              >
                <Copy className="w-3 h-3 mr-2" />
                Duplicate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}