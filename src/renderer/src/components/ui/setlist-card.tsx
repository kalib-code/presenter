import React from 'react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@renderer/components/ui/dropdown-menu'
import {
  Play,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Music,
  Presentation,
  Timer,
  Video,
  Image,
  Volume2,
  MessageSquare,
  Users,
  Clock
} from 'lucide-react'
import type { Setlist } from '@renderer/types/database'

interface SetlistCardProps {
  setlist: Setlist
  onView: (setlist: Setlist) => void
  onEdit: (setlist: Setlist) => void
  onDuplicate: (setlist: Setlist) => void
  onDelete: (setlist: Setlist) => void
  onPresent: (setlist: Setlist) => void
  className?: string
}

export function SetlistCard({
  setlist,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onPresent,
  className = ''
}: SetlistCardProps) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song':
        return <Music className="w-3 h-3 text-blue-600" />
      case 'presentation':
        return <Presentation className="w-3 h-3 text-green-600" />
      case 'video':
        return <Video className="w-3 h-3 text-red-600" />
      case 'image':
        return <Image className="w-3 h-3 text-yellow-600" />
      case 'audio':
        return <Volume2 className="w-3 h-3 text-purple-600" />
      case 'countdown':
        return <Timer className="w-3 h-3 text-red-600" />
      case 'announcement':
        return <MessageSquare className="w-3 h-3 text-orange-600" />
      default:
        return <Music className="w-3 h-3 text-muted-foreground" />
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getTotalDuration = (items: typeof setlist.items) => {
    return items.reduce((total, item) => total + (item.duration || 0), 0)
  }

  const totalDuration = getTotalDuration(setlist.items)

  return (
    <div
      className={`group relative bg-card border rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50 ${className}`}
      onClick={() => onView(setlist)}
    >
      {/* Thumbnail Preview */}
      <div className="mb-3 h-16 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border/50 flex items-center justify-center overflow-hidden">
        {setlist.items.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap justify-center px-2">
            {setlist.items.slice(0, 6).map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex items-center justify-center w-6 h-6 rounded bg-background/80 border border-border/30"
              >
                {getItemIcon(item.type)}
              </div>
            ))}
            {setlist.items.length > 6 && (
              <div className="flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium text-muted-foreground">
                +{setlist.items.length - 6}
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground/50">
            <Music className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {setlist.name}
          </h3>
          {setlist.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {setlist.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{setlist.items.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(totalDuration)}</span>
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground">
          {new Date(setlist.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onPresent(setlist)
          }}
          className="h-7 w-7 p-0"
        >
          <Play className="w-3 h-3" />
          <span className="sr-only">Start presentation</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="h-7 w-7 p-0"
            >
              <MoreVertical className="w-3 h-3" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(setlist)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPresent(setlist)}>
              <Play className="w-4 h-4 mr-2" />
              Start Presentation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(setlist)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(setlist)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(setlist)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}