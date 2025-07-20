import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Separator } from '@renderer/components/ui/separator'
import {
  Play,
  Square,
  Eye,
  EyeOff,
  Music,
  Presentation,
  Timer,
  Video,
  Image,
  Volume2,
  MessageSquare,
  ArrowRight,
  Clock
} from 'lucide-react'
import type { SetlistItem } from '@renderer/types/database'
import { MediaPlayer } from '@renderer/components/ui/media-player'
import { formatTimeFromSeconds } from '@renderer/lib/time-utils'

interface ItemPreviewPanelProps {
  currentItem: SetlistItem | null
  nextItem: SetlistItem | null
  onGoLive?: (item: SetlistItem) => void
  onClearOutput?: () => void
  onPreview?: (item: SetlistItem) => void
  className?: string
}

export function ItemPreviewPanel({
  currentItem,
  nextItem,
  onGoLive,
  onClearOutput,
  onPreview,
  className = ''
}: ItemPreviewPanelProps) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song':
        return <Music className="w-4 h-4 text-blue-600" />
      case 'presentation':
        return <Presentation className="w-4 h-4 text-green-600" />
      case 'video':
        return <Video className="w-4 h-4 text-red-600" />
      case 'image':
        return <Image className="w-4 h-4 text-yellow-600" />
      case 'audio':
        return <Volume2 className="w-4 h-4 text-purple-600" />
      case 'countdown':
        return <Timer className="w-4 h-4 text-red-600" />
      case 'announcement':
        return <MessageSquare className="w-4 h-4 text-orange-600" />
      default:
        return <Music className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getPreviewContent = (item: SetlistItem) => {
    switch (item.type) {
      case 'song':
        return (
          <div className="text-center py-8">
            <Music className="w-12 h-12 mx-auto mb-3 text-blue-600/50" />
            <p className="text-sm text-muted-foreground mb-2">Song Preview</p>
            <p className="text-lg font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Lyrics and chords will appear here
            </p>
          </div>
        )

      case 'presentation':
        return (
          <div className="text-center py-8">
            <Presentation className="w-12 h-12 mx-auto mb-3 text-green-600/50" />
            <p className="text-sm text-muted-foreground mb-2">Presentation Preview</p>
            <p className="text-lg font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Slides will be shown here
            </p>
          </div>
        )

      case 'countdown':
        return (
          <div className="text-center py-8">
            <Timer className="w-12 h-12 mx-auto mb-3 text-red-600/50" />
            <p className="text-sm text-muted-foreground mb-2">Countdown Timer</p>
            <p className="text-lg font-medium">{item.title}</p>
            <div className="mt-3 space-y-1">
              {item.countdownDuration && (
                <p className="text-sm text-muted-foreground">
                  Duration: {formatTimeFromSeconds(item.countdownDuration)}
                </p>
              )}
              {item.countdownMessage && (
                <p className="text-sm text-muted-foreground">
                  Message: "{item.countdownMessage}"
                </p>
              )}
            </div>
          </div>
        )

      case 'video':
      case 'audio':
      case 'image':
        return (
          <div className="h-full">
            <MediaPlayer
              item={item}
              autoplay={false}
              className="h-full"
            />
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-muted/50 flex items-center justify-center">
              {getItemIcon(item.type)}
            </div>
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <p className="text-lg font-medium">{item.title}</p>
          </div>
        )
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Live Preview</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Preview and control output
        </p>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Live Output Status */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium">Live Output</span>
            </div>
            {currentItem && (
              <Badge variant="secondary" className="text-xs">
                {currentItem.type}
              </Badge>
            )}
          </div>
          {currentItem && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {currentItem.title}
            </p>
          )}
        </div>

        {/* Preview Content */}
        <div className="flex-1 bg-black/5 border-b">
          {currentItem ? (
            <div className="h-full relative">
              {getPreviewContent(currentItem)}
              
              {/* Preview Overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview?.(currentItem)}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Square className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No output</p>
                <p className="text-xs mt-1">Select an item to preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="p-3 space-y-3">
          <div className="flex gap-2">
            {currentItem && onGoLive && (
              <Button
                size="sm"
                onClick={() => onGoLive(currentItem)}
                className="flex-1"
              >
                <Play className="w-3 h-3 mr-2" />
                Go Live
              </Button>
            )}
            {onClearOutput && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearOutput}
                className="flex-1"
              >
                <EyeOff className="w-3 h-3 mr-2" />
                Clear
              </Button>
            )}
          </div>

          <Separator />

          {/* Next Up */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Next Up
              </span>
            </div>
            
            {nextItem ? (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="flex-shrink-0">
                  {getItemIcon(nextItem.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{nextItem.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {nextItem.type}
                    {nextItem.duration && (
                      <span className="ml-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTimeFromSeconds(nextItem.duration)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  No upcoming items
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}