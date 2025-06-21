import { useState, useEffect, useCallback } from 'react'
import { useSetlistStore } from '@renderer/store/setlist'
import { useSongStore } from '@renderer/store/song'
import { usePresentationStore } from '@renderer/store/presentation'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Separator } from '@renderer/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Square,
  ChevronLeft,
  ChevronRight,
  Monitor,
  MonitorOff,
  Image,
  Music,
  Presentation,
  MessageSquare,
  Timer,
  Eye,
  EyeOff,
  ChevronDown,
  List,
  GripVertical
} from 'lucide-react'
import type { Setlist, SetlistItem } from '@renderer/types/database'

interface ContentCard {
  id: string
  title: string
  content: string
  type: 'verse' | 'chorus' | 'bridge' | 'slide' | 'announcement' | 'countdown'
  order: number
  elementStyles?: {
    fontSize?: number
    color?: string
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
    textShadow?: string
    lineHeight?: number
    left?: number
    top?: number
    width?: number
    height?: number
    transform?: string
    opacity?: number
  }
  slideBackground?: {
    type: string
    value: string
    opacity?: number
  }
  globalBackground?: {
    type: string
    value: string
    opacity?: number
  }
}

interface ProjectionState {
  isProjecting: boolean
  isBlank: boolean
  showLogo: boolean
  currentContent: string
  currentTitle: string
}

// Sortable setlist item component
interface SortableSetlistItemProps {
  item: SetlistItem
  index: number
  isSelected: boolean
  onSelect: (item: SetlistItem) => void
  getItemIcon: (type: string) => JSX.Element
}

// Sortable content card component
interface SortableContentCardProps {
  card: ContentCard
  isSelected: boolean
  onSelect: (card: ContentCard) => void
  getCardStyling: (type: string) => string
}

function SortableSetlistItem({
  item,
  index,
  isSelected,
  onSelect,
  getItemIcon
}: SortableSetlistItemProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full p-3 rounded-lg text-left transition-colors border ${
        isSelected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'hover:bg-accent border-border'
      } ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Item Content */}
        <button onClick={() => onSelect(item)} className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-mono w-6">{index + 1}</span>
          {getItemIcon(item.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium truncate">{item.title}</div>
              {item.duration && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {Math.floor(item.duration / 60)}m
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

// Function to render card content as projection preview (16:9 aspect ratio)
function renderCardContent(card: ContentCard): JSX.Element {
  console.log(
    'Rendering card:',
    card.title,
    'Type:',
    card.type,
    'Content length:',
    card.content.length,
    'Content preview:',
    card.content.substring(0, 100)
  )

  // Check if content has video/image references (basic detection)
  const hasVideoBackground =
    card.content.includes('.mp4') || card.content.includes('.mov') || card.content.includes('.webm')
  const hasImageBackground =
    card.content.includes('.jpg') ||
    card.content.includes('.png') ||
    card.content.includes('.jpeg') ||
    card.content.includes('.webp')

  // Extract media URL if present (simple regex)
  const mediaMatch = card.content.match(
    /\b(https?:\/\/[^\s]+\.(mp4|mov|webm|jpg|png|jpeg|webp))\b/i
  )
  const mediaUrl = mediaMatch ? mediaMatch[1] : null

  // Clean content (remove media URLs for text display)
  const cleanContent = card.content
    .replace(/\b(https?:\/\/[^\s]+\.(mp4|mov|webm|jpg|png|jpeg|webp))\b/gi, '')
    .trim()
  const displayContent = cleanContent || card.content

  console.log('Display content:', displayContent)

  // Render countdown content specially
  if (card.type === 'countdown') {
    const countdownMatch =
      displayContent.match(/(\d+)s - (.+)/) || card.content.match(/(\d+)s - (.+)/)
    const duration = countdownMatch ? countdownMatch[1] : '300'
    const message = countdownMatch ? countdownMatch[2] : displayContent

    return (
      <div className="w-full aspect-video bg-black rounded border border-gray-300 relative overflow-hidden">
        {/* Background media if present */}
        {hasVideoBackground && mediaUrl ? (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={mediaUrl}
            muted
            loop
            autoPlay
            playsInline
          />
        ) : hasImageBackground && mediaUrl ? (
          <img
            className="absolute inset-0 w-full h-full object-cover"
            src={mediaUrl}
            alt="Background"
          />
        ) : null}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            {Math.floor(parseInt(duration) / 60)}:
            {(parseInt(duration) % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-lg text-white text-center font-medium drop-shadow-lg">{message}</div>
        </div>
      </div>
    )
  }

  // Regular content rendering
  return (
    <div className="w-full aspect-video bg-black rounded border border-gray-300 relative overflow-hidden">
      {/* Background Layer - Use slide background or global background */}
      {(() => {
        // Prioritize slide-specific background, then global background
        const background = card.slideBackground || card.globalBackground

        if (background?.type === 'video' && background.value) {
          return (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={background.value}
              autoPlay
              loop
              muted
              playsInline
              style={{ opacity: background.opacity || 1 }}
            />
          )
        } else if (background?.type === 'image' && background.value) {
          return (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${background.value})`,
                opacity: background.opacity || 1
              }}
            />
          )
        }

        // Fallback to media URLs in content
        if (hasVideoBackground && mediaUrl) {
          return (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={mediaUrl}
              muted
              loop
              autoPlay
              playsInline
            />
          )
        } else if (hasImageBackground && mediaUrl) {
          return (
            <img
              className="absolute inset-0 w-full h-full object-cover"
              src={mediaUrl}
              alt="Background"
            />
          )
        }

        return null
      })()}

      {/* Text content overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <div
          className="text-center drop-shadow-lg whitespace-pre-line overflow-hidden"
          style={{
            // Scale font size based on container width (16:9 aspect ratio scaling)
            // Editor canvas is typically 1920x1080, so we scale proportionally
            fontSize: card.elementStyles?.fontSize
              ? `${Math.max(11, card.elementStyles.fontSize * 0.18)}px` // Scale down from editor size
              : '15px', // Default scaled size
            color: card.elementStyles?.color || '#FFFFFF',
            fontFamily: card.elementStyles?.fontFamily || 'Arial, sans-serif',
            fontWeight: card.elementStyles?.fontWeight || 'bold',
            fontStyle: card.elementStyles?.fontStyle || 'normal',
            textAlign: (card.elementStyles?.textAlign as any) || 'center',
            textShadow: card.elementStyles?.textShadow || '1px 1px 2px rgba(0,0,0,0.8)',
            lineHeight: card.elementStyles?.lineHeight || 1.3,
            opacity: card.elementStyles?.opacity || 1,
            // For preview cards, always center the content instead of using absolute positioning
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {displayContent || `[No content for ${card.title}]`}
        </div>
      </div>
    </div>
  )
}

function SortableContentCard({
  card,
  isSelected,
  onSelect,
  getCardStyling
}: SortableContentCardProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${isDragging ? 'z-50' : ''}`}>
      <div
        className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md cursor-pointer ${
          isSelected ? 'border-primary ring-2 ring-primary/20' : getCardStyling(card.type)
        }`}
        onClick={() => onSelect(card)}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 bg-black/10 hover:bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <GripVertical className="w-3 h-3" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {card.title}
            </Badge>
            {(card.type === 'verse' || card.type === 'chorus' || card.type === 'bridge') && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Lyrics
              </Badge>
            )}
          </div>
          {isSelected && <div className="w-2 h-2 bg-primary rounded-full"></div>}
        </div>

        {/* Content Preview */}
        <div className="relative">{renderCardContent(card)}</div>
      </div>
    </div>
  )
}

export default function Home(): JSX.Element {
  const { setlists, loadSetlists, startPresentation, updateSetlist } = useSetlistStore()
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Load data on mount
  useEffect(() => {
    loadSetlists()
    fetchSongs()
    loadPresentations()
  }, [loadSetlists, fetchSongs, loadPresentations])

  // Refresh data when window gains focus (to pick up changes made in editor)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🎯 [HOME] Window focused, refreshing song data...')
      fetchSongs() // Refresh songs to get updated background data
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchSongs])

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
        console.log('Selected song item:', selectedItem)
        console.log(
          'Available songs:',
          songs.length,
          songs.map((s) => ({ id: s.id, name: s.name }))
        )
        console.log('Looking for song with referenceId:', selectedItem.referenceId)

        const song = songs.find((s) => s.id === selectedItem.referenceId)
        console.log('Found song:', song)

        if (song) {
          console.log(
            'Processing song:',
            song.name,
            'Lyrics length:',
            song.lyrics?.length,
            'Slides count:',
            song.slides?.length
          )

          // Extract content from slides with proper background and styling data
          if (song.slides && song.slides.length > 0) {
            console.log('🎵 Extracting lyrics from slides...')
            song.slides.forEach((slide, slideIndex) => {
              console.log(`🎵 Slide ${slideIndex}:`, {
                title: slide.title,
                type: slide.type,
                elementsCount: slide.elements?.length || 0,
                hasBackground: !!slide.background,
                backgroundType: slide.background?.type
              })

              if (slide.elements && slide.elements.length > 0) {
                slide.elements.forEach((element, elementIndex) => {
                  if (
                    element.type === 'text' &&
                    element.content &&
                    typeof element.content === 'string'
                  ) {
                    console.log(`🎵   Element ${elementIndex}:`, {
                      type: element.type,
                      contentLength: element.content.length,
                      contentPreview: element.content.substring(0, 100) + '...',
                      hasStyle: !!element.style,
                      hasPosition: !!element.position,
                      hasSize: !!element.size
                    })

                    // Create content card from slide
                    let cardType: 'verse' | 'chorus' | 'bridge' = 'verse'
                    let cardTitle = slide.title || `Slide ${slideIndex + 1}`

                    // Determine type from slide type or title
                    if (slide.type === 'chorus' || slide.title?.toLowerCase().includes('chorus')) {
                      cardType = 'chorus'
                      cardTitle = slide.title || 'Chorus'
                    } else if (
                      slide.type === 'bridge' ||
                      slide.title?.toLowerCase().includes('bridge')
                    ) {
                      cardType = 'bridge'
                      cardTitle = slide.title || 'Bridge'
                    } else if (
                      slide.type === 'verse' ||
                      slide.title?.toLowerCase().includes('verse')
                    ) {
                      cardType = 'verse'
                      cardTitle = slide.title || `Verse ${slideIndex + 1}`
                    }

                    // Create comprehensive element styles with defaults
                    const elementStyles = {
                      fontSize: element.style?.fontSize || 48,
                      color: element.style?.color || '#FFFFFF',
                      fontFamily: element.style?.fontFamily || 'Arial, sans-serif',
                      fontWeight: element.style?.fontWeight || 'bold',
                      fontStyle: element.style?.fontStyle || 'normal',
                      textAlign: element.style?.textAlign || 'center',
                      textShadow: element.style?.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
                      lineHeight: element.style?.lineHeight || 1.2,
                      left: element.position?.x || 96,
                      top: element.position?.y || 139,
                      width: element.size?.width || 779,
                      height: element.size?.height || 197,
                      opacity: element.style?.opacity || 1
                    }

                    cards.push({
                      id: `${selectedItem.id}-slide-${slideIndex}-element-${elementIndex}`,
                      title: cardTitle,
                      content: element.content,
                      type: cardType,
                      order: slideIndex,
                      elementStyles: elementStyles,
                      slideBackground: slide.background,
                      globalBackground: song.globalBackground
                    })
                  }
                })
              } else {
                // Handle slides without elements - create default text element
                console.log(`🎵 Slide ${slideIndex} has no elements, creating default text element`)

                let cardType: 'verse' | 'chorus' | 'bridge' = 'verse'
                let cardTitle = slide.title || `Slide ${slideIndex + 1}`
                const content = slide.content || slide.title || `Slide ${slideIndex + 1}`

                // Determine type from slide type or title
                if (slide.type === 'chorus' || slide.title?.toLowerCase().includes('chorus')) {
                  cardType = 'chorus'
                  cardTitle = slide.title || 'Chorus'
                } else if (
                  slide.type === 'bridge' ||
                  slide.title?.toLowerCase().includes('bridge')
                ) {
                  cardType = 'bridge'
                  cardTitle = slide.title || 'Bridge'
                } else if (slide.type === 'verse' || slide.title?.toLowerCase().includes('verse')) {
                  cardType = 'verse'
                  cardTitle = slide.title || `Verse ${slideIndex + 1}`
                }

                // Create default element styles
                const elementStyles = {
                  fontSize: 48,
                  color: '#FFFFFF',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontStyle: 'normal',
                  textAlign: 'center',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  lineHeight: 1.2,
                  left: 96,
                  top: 139,
                  width: 779,
                  height: 197,
                  opacity: 1
                }

                cards.push({
                  id: `${selectedItem.id}-slide-${slideIndex}`,
                  title: cardTitle,
                  content: content,
                  type: cardType,
                  order: slideIndex,
                  elementStyles: elementStyles,
                  slideBackground: slide.background,
                  globalBackground: song.globalBackground
                })
              }
            })
          }

          // Fallback to legacy lyrics field if no slides found
          if (cards.length === 0) {
            console.log('🎵 No slides found, checking legacy lyrics field...')
            if (!song.lyrics || song.lyrics.trim() === '') {
              console.warn('🎵 Song has no lyrics in either slides or lyrics field')
              cards.push({
                id: selectedItem.id,
                title: 'No Lyrics Available',
                content: `The song "${song.name || 'Unknown'}" doesn't have any lyrics yet.`,
                type: 'verse',
                order: 0
              })
            } else {
              console.log('🎵 Processing legacy lyrics format...')
              // Parse song structure (verses, chorus, bridge)
              const verses = song.lyrics.split('\n\n')
              verses.forEach((verse, index) => {
                if (!verse.trim()) return // Skip empty verses

                const lines = verse.trim().split('\n')
                const firstLine = lines[0]?.toLowerCase() || ''

                let type: 'verse' | 'chorus' | 'bridge' = 'verse'
                let title = `Verse ${index + 1}`
                let content = verse.trim()

                // Check if first line is a section header and remove it from content
                if (firstLine.includes('chorus')) {
                  type = 'chorus'
                  title = 'Chorus'
                  // Remove the header line if it's just a label
                  if (firstLine.trim() === 'chorus' || firstLine.trim() === 'chorus:') {
                    content = lines.slice(1).join('\n').trim()
                  }
                } else if (firstLine.includes('bridge')) {
                  type = 'bridge'
                  title = 'Bridge'
                  // Remove the header line if it's just a label
                  if (firstLine.trim() === 'bridge' || firstLine.trim() === 'bridge:') {
                    content = lines.slice(1).join('\n').trim()
                  }
                } else if (firstLine.includes('verse')) {
                  type = 'verse'
                  // Extract verse number if present
                  const verseMatch = firstLine.match(/verse\s*(\d+)/i)
                  if (verseMatch) {
                    title = `Verse ${verseMatch[1]}`
                  }
                  // Remove the header line if it's just a label
                  if (firstLine.match(/^verse\s*\d*:?\s*$/i)) {
                    content = lines.slice(1).join('\n').trim()
                  }
                }

                if (content) {
                  // Only add if there's actual content
                  cards.push({
                    id: `${selectedItem.id}-${index}`,
                    title,
                    content,
                    type,
                    order: index
                  })
                }
              })
            }
          }

          console.log('🎵 Total content cards created:', cards.length)
          cards.forEach((card, index) => {
            console.log(`🎵 Card ${index}:`, {
              title: card.title,
              type: card.type,
              contentLength: card.content.length,
              contentPreview: card.content.substring(0, 50) + '...'
            })
          })
        } else {
          console.error(
            'Song not found! Available songs:',
            songs.map((s) => ({ id: s.id, name: s.name }))
          )
          // Add a placeholder card to show the issue
          cards.push({
            id: selectedItem.id,
            title: 'Song Not Found',
            content: `Could not find song with ID: ${selectedItem.referenceId}`,
            type: 'verse',
            order: 0
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
  const projectContent = useCallback(async (card: ContentCard) => {
    // First, refresh the song data to ensure we have the latest background information
    console.log('🎯 [PROJECTION] Refreshing song data before projection...')
    await fetchSongs()

    // Find the updated song data
    const currentSongs = useSongStore.getState().songs
    const updatedSong = currentSongs.find((s) => s.id === selectedItem?.referenceId)

    if (updatedSong && selectedItem?.type === 'song') {
      // Find the corresponding slide for this card
      const slideIndex = parseInt(card.id.split('-slide-')[1]?.split('-')[0] || '0')
      const slide = updatedSong.slides?.[slideIndex]

      if (slide) {
        // Update the card with fresh background data
        card = {
          ...card,
          slideBackground: slide.background,
          globalBackground: updatedSong.globalBackground
        }

        console.log('🎯 [PROJECTION] Updated card with fresh background data:', {
          hasSlideBackground: !!card.slideBackground,
          slideBackground: card.slideBackground,
          hasGlobalBackground: !!card.globalBackground,
          globalBackground: card.globalBackground
        })
      }
    }

    console.log('🎯 [PROJECTION] Projecting card:', {
      title: card.title,
      type: card.type,
      hasElementStyles: !!card.elementStyles,
      elementStyles: card.elementStyles,
      hasSlideBackground: !!card.slideBackground,
      slideBackground: card.slideBackground,
      hasGlobalBackground: !!card.globalBackground,
      globalBackground: card.globalBackground
    })

    setSelectedCard(card)
    setProjectionState((prev) => ({
      ...prev,
      isProjecting: true,
      currentContent: card.content,
      currentTitle: card.title
    }))

    // Prepare slide data with background and element information
    const slideData = {
      elements: card.elementStyles
        ? [
            {
              type: 'text',
              content: card.content,
              position: {
                x: card.elementStyles.left || 96,
                y: card.elementStyles.top || 139
              },
              size: {
                width: card.elementStyles.width || 779,
                height: card.elementStyles.height || 197
              },
              style: card.elementStyles
            }
          ]
        : [
            {
              type: 'text',
              content: card.content,
              position: { x: 96, y: 139 },
              size: { width: 779, height: 197 },
              style: {
                fontSize: 48,
                color: '#FFFFFF',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                lineHeight: 1.2
              }
            }
          ],
      globalBackground: card.globalBackground,
      slideBackground: card.slideBackground
    }

    console.log('🎯 [PROJECTION] Generated slideData:', {
      elementsCount: slideData.elements.length,
      hasGlobalBackground: !!slideData.globalBackground,
      globalBackground: slideData.globalBackground,
      hasSlideBackground: !!slideData.slideBackground,
      slideBackground: slideData.slideBackground
    })

    // Send rich content data to electron main process for second display
    window.electron?.ipcRenderer.send('project-content', {
      title: card.title,
      content: card.content,
      type: card.type,
      slideData: slideData
    })
  }, [])

  // Navigation functions
  const goToNextCard = useCallback(async () => {
    if (!selectedCard || contentCards.length === 0) return

    const currentIndex = contentCards.findIndex((card) => card.id === selectedCard.id)
    const nextIndex = (currentIndex + 1) % contentCards.length
    await projectContent(contentCards[nextIndex])
  }, [selectedCard, contentCards, projectContent])

  const goToPrevCard = useCallback(async () => {
    if (!selectedCard || contentCards.length === 0) return

    const currentIndex = contentCards.findIndex((card) => card.id === selectedCard.id)
    const prevIndex = currentIndex === 0 ? contentCards.length - 1 : currentIndex - 1
    await projectContent(contentCards[prevIndex])
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

  // Handle setlist change
  const handleSetlistChange = (setlist: Setlist) => {
    setSelectedSetlist(setlist)
    setSelectedItem(null) // Clear selected item when changing setlist
    setContentCards([])
    setSelectedCard(null)
  }

  // Handle drag end for setlist items
  const handleSetlistDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event

    if (!selectedSetlist || !over || active.id === over.id) return

    const oldIndex = selectedSetlist.items.findIndex((item) => item.id === active.id)
    const newIndex = selectedSetlist.items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(selectedSetlist.items, oldIndex, newIndex)

    // Update the setlist with reordered items
    const updatedSetlist = {
      ...selectedSetlist,
      items: newItems.map((item, index) => ({ ...item, order: index }))
    }

    // Update local state immediately for smooth UX
    setSelectedSetlist(updatedSetlist)

    // Update in database
    await updateSetlist(selectedSetlist.id, { items: updatedSetlist.items })
  }

  // Handle drag end for content cards
  const handleCardDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = contentCards.findIndex((card) => card.id === active.id)
    const newIndex = contentCards.findIndex((card) => card.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newCards = arrayMove(contentCards, oldIndex, newIndex)
    const reorderedCards = newCards.map((card, index) => ({ ...card, order: index }))

    setContentCards(reorderedCards)
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
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Current Setlist</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <List className="w-4 h-4 mr-2" />
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {setlists.map((setlist) => (
                    <DropdownMenuItem
                      key={setlist.id}
                      onClick={() => handleSetlistChange(setlist)}
                      className={selectedSetlist?.id === setlist.id ? 'bg-accent' : ''}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{setlist.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {setlist.items.length} items • {setlist.description || 'No description'}
                        </div>
                      </div>
                      {selectedSetlist?.id === setlist.id && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {setlists.length === 0 && (
                    <DropdownMenuItem disabled>
                      <div className="text-center text-muted-foreground">No setlists available</div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {selectedSetlist && (
              <div className="mt-2">
                <p className="text-sm font-medium">{selectedSetlist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedSetlist.items.length} items
                  {selectedSetlist.description && ` • ${selectedSetlist.description}`}
                </p>
              </div>
            )}
          </div>

          <div className="p-2 overflow-y-auto h-full">
            {selectedSetlist?.items && selectedSetlist.items.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSetlistDragEnd}
              >
                <SortableContext
                  items={selectedSetlist.items}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {selectedSetlist.items.map((item, index) => (
                      <SortableSetlistItem
                        key={item.id}
                        item={item}
                        index={index}
                        isSelected={selectedItem?.id === item.id}
                        onSelect={setSelectedItem}
                        getItemIcon={getItemIcon}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <List className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items in setlist</p>
                </div>
              </div>
            )}
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
                    {selectedItem.type === 'song' ? 'Song Lyrics' : selectedItem.type} •{' '}
                    {contentCards.length} {contentCards.length === 1 ? 'card' : 'cards'}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCardDragEnd}
              >
                <SortableContext items={contentCards} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {contentCards.map((card) => (
                      <SortableContentCard
                        key={card.id}
                        card={card}
                        isSelected={selectedCard?.id === card.id}
                        onSelect={(card) => {
                          projectContent(card).catch(console.error)
                        }}
                        getCardStyling={getCardStyling}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
            <div className="aspect-video bg-black rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden mb-4">
              {/* Background Layer */}
              {selectedItem &&
                (() => {
                  // Get the current song data for background
                  const currentSong =
                    selectedItem.type === 'song'
                      ? songs.find((s) => s.id === selectedItem.referenceId)
                      : null

                  // Get global background from song
                  const globalBackground = currentSong?.globalBackground

                  return (
                    <>
                      {/* Global Background */}
                      {globalBackground?.type === 'video' && globalBackground.value && (
                        <video
                          className="absolute inset-0 w-full h-full object-cover"
                          src={globalBackground.value}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            opacity: globalBackground.opacity || 1
                          }}
                        />
                      )}
                      {globalBackground?.type === 'image' && globalBackground.value && (
                        <div
                          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url(${globalBackground.value})`,
                            opacity: globalBackground.opacity || 1
                          }}
                        />
                      )}
                    </>
                  )
                })()}

              {/* Content Layer */}
              <div className="absolute inset-0 flex items-center justify-center">
                {projectionState.isProjecting && !projectionState.isBlank ? (
                  <div className="text-white text-center p-4 w-full h-full flex items-center justify-center">
                    <div className="text-sm whitespace-pre-wrap font-bold drop-shadow-lg max-w-full overflow-hidden">
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

            {/* Notes Section */}
            {selectedItem?.notes && (
              <div className="mt-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-amber-800">Notes</span>
                  </div>
                  <div className="text-sm text-amber-700 whitespace-pre-wrap leading-relaxed">
                    {selectedItem.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
