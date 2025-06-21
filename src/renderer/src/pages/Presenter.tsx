import React, { useState, useEffect, useCallback } from 'react'
import { useSetlistStore } from '@renderer/store/setlist'
import { useSongStore } from '@renderer/store/song'
import { usePresentationStore } from '@renderer/store/presentation'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Separator } from '@renderer/components/ui/separator'
import {
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  Monitor,
  MonitorOff,
  Image,
  Clock,
  Music,
  Presentation,
  MessageSquare,
  Timer,
  Eye,
  EyeOff,
  Volume2,
  VolumeX
} from 'lucide-react'
import type { Setlist, SetlistItem } from '@renderer/types/database'

interface ContentCard {
  id: string
  title: string
  content: string
  type: 'verse' | 'chorus' | 'bridge' | 'slide' | 'announcement' | 'countdown'
  order: number
}

interface ProjectionState {
  isProjecting: boolean
  isBlank: boolean
  showLogo: boolean
  currentContent: string
  currentTitle: string
}

export default function Presenter(): JSX.Element {
  const { setlists, loadSetlists, startPresentation } = useSetlistStore()
  const { songs, fetchSongs } = useSongStore()
  const { presentations, loadPresentations } = usePresentationStore()

  // State management
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null)
  const [selectedItem, setSelectedItem] = useState<SetlistItem | null>(null)
  const [contentCards, setContentCards] = useState<ContentCard[]>([])
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null)
  const [projectionState, setProjectionState] = useState<ProjectionState>({
    isProjecting: false,
    isBlank: false,
    showLogo: false,
    currentContent: '',
    currentTitle: ''
  })

  // Load data on mount
  useEffect(() => {
    loadSetlists()
    fetchSongs()
    loadPresentations()
  }, [loadSetlists, fetchSongs, loadPresentations])

  // Auto-select first setlist if available
  useEffect(() => {
    if (setlists.length > 0 && !selectedSetlist) {
      setSelectedSetlist(setlists[0])
    }
  }, [setlists, selectedSetlist])

  // Generate content cards when item is selected
  useEffect(() => {
    if (!selectedItem) {
      setContentCards([])
      return
    }

    const cards: ContentCard[] = []

    switch (selectedItem.type) {
      case 'song':
        const song = songs.find((s) => s.id === selectedItem.referenceId)
        if (song) {
          // Parse song structure (verses, chorus, bridge)
          const verses = song.lyrics.split('\n\n')
          verses.forEach((verse, index) => {
            const lines = verse.trim().split('\n')
            const firstLine = lines[0]?.toLowerCase() || ''

            let type: 'verse' | 'chorus' | 'bridge' = 'verse'
            let title = `Verse ${index + 1}`

            if (firstLine.includes('chorus')) {
              type = 'chorus'
              title = 'Chorus'
            } else if (firstLine.includes('bridge')) {
              type = 'bridge'
              title = 'Bridge'
            }

            cards.push({
              id: `${selectedItem.id}-${index}`,
              title,
              content: verse.trim(),
              type,
              order: index
            })
          })
        }
        break

      case 'presentation':
        const presentation = presentations.find((p) => p.id === selectedItem.referenceId)
        if (presentation) {
          presentation.slides.forEach((slide, index) => {
            cards.push({
              id: `${selectedItem.id}-${index}`,
              title: `Slide ${index + 1}`,
              content: slide.content || slide.title || `Slide ${index + 1}`,
              type: 'slide',
              order: index
            })
          })
        }
        break

      case 'announcement':
        cards.push({
          id: selectedItem.id,
          title: 'Announcement',
          content: selectedItem.title,
          type: 'announcement',
          order: 0
        })
        break

      case 'countdown':
        cards.push({
          id: selectedItem.id,
          title: 'Countdown Timer',
          content: `${selectedItem.countdownDuration || 300}s - ${selectedItem.countdownMessage || 'Service Starting Soon!'}`,
          type: 'countdown',
          order: 0
        })
        break
    }

    setContentCards(cards)
    setSelectedCard(cards[0] || null)
  }, [selectedItem, songs, presentations])

  // Project content to second display
  const projectContent = useCallback((card: ContentCard) => {
    setSelectedCard(card)
    setProjectionState((prev) => ({
      ...prev,
      isProjecting: true,
      currentContent: card.content,
      currentTitle: card.title
    }))

    // TODO: Send to electron main process for second display
    window.electron?.ipcRenderer.send('project-content', {
      title: card.title,
      content: card.content,
      type: card.type
    })
  }, [])

  // Navigation functions
  const goToNextCard = useCallback(() => {
    if (!selectedCard || contentCards.length === 0) return

    const currentIndex = contentCards.findIndex((card) => card.id === selectedCard.id)
    const nextIndex = (currentIndex + 1) % contentCards.length
    projectContent(contentCards[nextIndex])
  }, [selectedCard, contentCards, projectContent])

  const goToPrevCard = useCallback(() => {
    if (!selectedCard || contentCards.length === 0) return

    const currentIndex = contentCards.findIndex((card) => card.id === selectedCard.id)
    const prevIndex = currentIndex === 0 ? contentCards.length - 1 : currentIndex - 1
    projectContent(contentCards[prevIndex])
  }, [selectedCard, contentCards, projectContent])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault()
          goToNextCard()
          break
        case 'ArrowRight':
          event.preventDefault()
          goToNextCard()
          break
        case 'ArrowLeft':
          event.preventDefault()
          goToPrevCard()
          break
        case 'KeyB':
          event.preventDefault()
          toggleBlank()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [goToNextCard, goToPrevCard])

  // Projection controls
  const toggleBlank = () => {
    setProjectionState((prev) => ({ ...prev, isBlank: !prev.isBlank }))
    window.electron?.ipcRenderer.send('toggle-blank', !projectionState.isBlank)
  }

  const toggleLogo = () => {
    setProjectionState((prev) => ({ ...prev, showLogo: !prev.showLogo }))
    window.electron?.ipcRenderer.send('toggle-logo', !projectionState.showLogo)
  }

  const stopProjection = () => {
    setProjectionState((prev) => ({ ...prev, isProjecting: false, isBlank: false }))
    window.electron?.ipcRenderer.send('stop-projection')
  }

  // Get icon for item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song':
        return <Music className="w-4 h-4 text-blue-600" />
      case 'presentation':
        return <Presentation className="w-4 h-4 text-green-600" />
      case 'announcement':
        return <MessageSquare className="w-4 h-4 text-orange-600" />
      case 'countdown':
        return <Timer className="w-4 h-4 text-red-600" />
      default:
        return <Music className="w-4 h-4" />
    }
  }

  // Get card type styling
  const getCardStyling = (type: string) => {
    switch (type) {
      case 'verse':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950'
      case 'chorus':
        return 'border-green-200 bg-green-50 dark:bg-green-950'
      case 'bridge':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-950'
      case 'slide':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950'
      case 'announcement':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-950'
      case 'countdown':
        return 'border-red-200 bg-red-50 dark:bg-red-950'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Setlist */}
        <div className="w-80 border-r bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Current Setlist</h2>
            {selectedSetlist && (
              <p className="text-sm text-muted-foreground mt-1">{selectedSetlist.name}</p>
            )}
          </div>

          <div className="p-2 space-y-1 overflow-y-auto h-full">
            {selectedSetlist?.items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedItem?.id === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono w-6">{index + 1}</span>
                  {getItemIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-xs opacity-75 capitalize">{item.type}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center - Content Cards */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">
                  {selectedItem ? selectedItem.title : 'Select an item'}
                </h2>
                {selectedItem && (
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedItem.type} • {contentCards.length}{' '}
                    {contentCards.length === 1 ? 'card' : 'cards'}
                  </p>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPrevCard} disabled={!selectedCard}>
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextCard} disabled={!selectedCard}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant={projectionState.isBlank ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleBlank}
                >
                  {projectionState.isBlank ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {projectionState.isBlank ? 'Show' : 'Blank'}
                </Button>
              </div>
            </div>
          </div>

          {/* Content Cards Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {contentCards.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {contentCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => projectContent(card)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      selectedCard?.id === card.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : getCardStyling(card.type)
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {card.title}
                      </Badge>
                      {selectedCard?.id === card.id && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <div className="text-sm line-clamp-4 whitespace-pre-wrap">{card.content}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No content selected</p>
                  <p className="text-sm">Choose an item from the setlist to see content cards</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Preview */}
        <div className="w-80 border-l bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Live Preview</h2>
            <p className="text-sm text-muted-foreground">What's being projected</p>
          </div>

          {/* Preview Area */}
          <div className="p-4">
            <div className="aspect-video bg-black rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
              {projectionState.isProjecting && !projectionState.isBlank ? (
                <div className="text-white text-center p-4">
                  <div className="text-xs opacity-75 mb-2">{projectionState.currentTitle}</div>
                  <div className="text-sm whitespace-pre-wrap">
                    {projectionState.currentContent}
                  </div>
                </div>
              ) : projectionState.isBlank ? (
                <div className="text-gray-500 text-center">
                  <MonitorOff className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm">Screen Blanked</div>
                </div>
              ) : (
                <div className="text-gray-500 text-center">
                  <Monitor className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm">No Content</div>
                </div>
              )}
            </div>

            {/* Projection Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Projection Status</span>
                <Badge variant={projectionState.isProjecting ? 'default' : 'secondary'}>
                  {projectionState.isProjecting ? 'Live' : 'Offline'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={projectionState.isBlank ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleBlank}
                  className="w-full"
                >
                  {projectionState.isBlank ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant={projectionState.showLogo ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleLogo}
                  className="w-full"
                >
                  <Image className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={stopProjection}
                className="w-full"
                disabled={!projectionState.isProjecting}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Projection
              </Button>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="mt-6 p-3 bg-muted rounded-lg">
              <div className="text-xs font-medium mb-2">Keyboard Shortcuts</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Space / → : Next slide</div>
                <div>← : Previous slide</div>
                <div>B : Toggle blank</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
