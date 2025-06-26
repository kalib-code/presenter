import { useState, useEffect } from 'react'
import { useSetlistStore } from '@renderer/store/setlist'
import { useSongStore } from '@renderer/store/song'
import { usePresentationStore } from '@renderer/store/presentation'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Clock,
  Music,
  Presentation,
  FileImage,
  MessageSquare,
  Timer,
  X,
  HelpCircle,
  Keyboard,
  Video,
  Image,
  Volume2
} from 'lucide-react'
import type { SetlistItem } from '@renderer/types/database'
import { MediaPlayer } from '@renderer/components/ui/media-player'

export default function SetlistPresenter(): JSX.Element {
  const {
    currentSetlist,
    isPresenting,
    currentItemIndex,
    countdownTime,
    countdownActive,
    stopPresentation,
    goToItem,
    nextItem,
    previousItem,
    startCountdown,
    pauseCountdown,
    stopCountdown,
    setCountdownTime
  } = useSetlistStore()

  const { songs } = useSongStore()
  const { presentations } = usePresentationStore()

  const [customCountdownMinutes, setCustomCountdownMinutes] = useState(5)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.code) {
        case 'ArrowRight':
        case 'Space':
          event.preventDefault()
          nextItem()
          break
        case 'ArrowLeft':
          event.preventDefault()
          previousItem()
          break
        case 'Escape':
          event.preventDefault()
          if (showKeyboardHelp) {
            setShowKeyboardHelp(false)
          } else {
            stopPresentation()
          }
          break
        case 'KeyH':
        case 'Slash':
          event.preventDefault()
          setShowKeyboardHelp(!showKeyboardHelp)
          break
        case 'KeyP':
          event.preventDefault()
          if (countdownActive) {
            pauseCountdown()
          } else if (countdownTime > 0) {
            startCountdown(countdownTime)
          }
          break
        case 'KeyS':
          event.preventDefault()
          stopCountdown()
          break
        case 'Digit1':
          event.preventDefault()
          setCountdownTime(300)
          startCountdown(300)
          break
        case 'Digit2':
          event.preventDefault()
          setCountdownTime(600)
          startCountdown(600)
          break
        case 'Digit3':
          event.preventDefault()
          setCountdownTime(900)
          startCountdown(900)
          break
        case 'Digit4':
          event.preventDefault()
          setCountdownTime(1800)
          startCountdown(1800)
          break
        default:
          // Number keys for quick item navigation (1-9)
          if (event.code.startsWith('Digit') && currentSetlist) {
            const digit = parseInt(event.code.replace('Digit', ''))
            if (digit >= 1 && digit <= 9 && digit <= currentSetlist.items.length) {
              event.preventDefault()
              goToItem(digit - 1)
            }
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    isPresenting,
    currentSetlist,
    countdownActive,
    countdownTime,
    nextItem,
    previousItem,
    stopPresentation,
    startCountdown,
    pauseCountdown,
    stopCountdown,
    setCountdownTime,
    goToItem
  ])

  // Redirect if not presenting
  useEffect(() => {
    if (!isPresenting || !currentSetlist) {
      window.location.hash = '#/setlist'
    }
  }, [isPresenting, currentSetlist])

  if (!isPresenting || !currentSetlist) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No active presentation</p>
        <Button onClick={() => (window.location.hash = '#/setlist')}>Go to Setlists</Button>
      </div>
    )
  }

  const currentItem = currentSetlist.items[currentItemIndex]
  const nextItemData = currentSetlist.items[currentItemIndex + 1]

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song':
        return <Music className="w-5 h-5" />
      case 'presentation':
        return <Presentation className="w-5 h-5" />
      case 'media':
        return <FileImage className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'image':
        return <Image className="w-5 h-5" />
      case 'audio':
        return <Volume2 className="w-5 h-5" />
      case 'announcement':
        return <MessageSquare className="w-5 h-5" />
      case 'countdown':
        return <Timer className="w-5 h-5" />
      default:
        return <Music className="w-5 h-5" />
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getItemDetails = (item: SetlistItem) => {
    switch (item.type) {
      case 'song':
        const song = songs.find((s) => s.id === item.referenceId)
        return {
          title: song?.name || item.title,
          subtitle: 'Song',
          content: song?.lyrics || ''
        }
      case 'presentation':
        const presentation = presentations.find((p) => p.id === item.referenceId)
        return {
          title: presentation?.name || item.title,
          subtitle: 'Presentation',
          content: presentation?.name || ''
        }
      case 'video':
        return {
          title: item.title,
          subtitle: 'Video',
          content: item.notes || '',
          isMedia: true,
          mediaConfig: item.mediaConfig
        }
      case 'image':
        return {
          title: item.title,
          subtitle: 'Image',
          content: item.notes || '',
          isMedia: true,
          mediaConfig: item.mediaConfig
        }
      case 'audio':
        return {
          title: item.title,
          subtitle: 'Audio',
          content: item.notes || '',
          isMedia: true,
          mediaConfig: item.mediaConfig
        }
      case 'media':
        return {
          title: item.title,
          subtitle: 'Media',
          content: item.notes || '',
          isMedia: true,
          mediaConfig: item.mediaConfig
        }
      case 'countdown':
        return {
          title: item.title,
          subtitle: 'Countdown Timer',
          content: item.countdownMessage || 'Countdown Timer',
          countdownDuration: item.countdownDuration || 300
        }
      case 'announcement':
        return {
          title: item.title,
          subtitle: 'Announcement',
          content: item.notes || ''
        }
      default:
        return {
          title: item.title,
          subtitle: item.type,
          content: item.notes || ''
        }
    }
  }

  const currentDetails = currentItem ? getItemDetails(currentItem) : null
  const nextDetails = nextItemData ? getItemDetails(nextItemData) : null

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">{currentSetlist.name}</h1>
          <div className="text-sm text-gray-400">
            Item {currentItemIndex + 1} of {currentSetlist.items.length}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Countdown Timer */}
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4" />
            <div
              className={`font-mono text-lg ${countdownTime <= 60 && countdownTime > 0 ? 'text-red-400' : 'text-white'}`}
            >
              {formatTime(countdownTime)}
            </div>
            {countdownActive ? (
              <Button size="sm" variant="ghost" onClick={pauseCountdown}>
                <Pause className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startCountdown(countdownTime || 300)}
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={stopCountdown}>
              <Square className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            title="Keyboard shortcuts (H or ?)"
          >
            <Keyboard className="w-4 h-4" />
          </Button>

          <Button variant="destructive" onClick={stopPresentation}>
            <X className="w-4 h-4 mr-2" />
            End Presentation
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Current Item */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold mb-4">CURRENT</div>
            {currentDetails ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  {getItemIcon(currentItem.type)}
                  <div className="text-2xl text-gray-400">{currentDetails.subtitle}</div>
                </div>
                <div className="text-4xl font-bold mb-4">{currentDetails.title}</div>

                {/* Media Content */}
                {currentDetails.isMedia && currentDetails.mediaConfig ? (
                  <div className="max-w-4xl mx-auto">
                    <MediaPlayer
                      item={currentItem}
                      autoplay={currentDetails.mediaConfig.autoplay}
                      className="rounded-lg overflow-hidden"
                      onEnded={nextItem}
                    />
                  </div>
                ) : (
                  <>
                    {currentDetails.content && (
                      <div className="text-lg text-gray-300 max-w-2xl mx-auto">
                        {currentDetails.content}
                      </div>
                    )}
                  </>
                )}

                {currentItem.notes && (
                  <div className="text-sm text-yellow-400 bg-yellow-400/10 rounded-lg p-4 max-w-2xl mx-auto">
                    <strong>Notes:</strong> {currentItem.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-2xl text-gray-500">No item selected</div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4 mt-auto">
            <Button
              size="lg"
              variant="outline"
              onClick={previousItem}
              disabled={currentItemIndex === 0}
              className="bg-gray-800 border-gray-600 hover:bg-gray-700"
            >
              <SkipBack className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <div className="text-lg font-mono bg-gray-800 px-4 py-2 rounded-lg">
              {currentItemIndex + 1} / {currentSetlist.items.length}
            </div>

            <Button
              size="lg"
              variant="outline"
              onClick={nextItem}
              disabled={currentItemIndex >= currentSetlist.items.length - 1}
              className="bg-gray-800 border-gray-600 hover:bg-gray-700"
            >
              Next
              <SkipForward className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Next Item */}
          <div className="p-6 border-b border-gray-700">
            <div className="text-lg font-semibold mb-4 text-gray-300">NEXT UP</div>
            {nextDetails ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getItemIcon(nextItemData.type)}
                  <div className="text-sm text-gray-400">{nextDetails.subtitle}</div>
                </div>
                <div className="font-semibold">{nextDetails.title}</div>
                {nextItemData.notes && (
                  <div className="text-xs text-gray-400">{nextItemData.notes}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">End of setlist</div>
            )}
          </div>

          {/* Countdown Controls */}
          <div className="p-6 border-b border-gray-700">
            <div className="text-lg font-semibold mb-4 text-gray-300">TIMER</div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={customCountdownMinutes}
                  onChange={(e) => setCustomCountdownMinutes(parseInt(e.target.value) || 1)}
                  className="w-20 bg-gray-800 border-gray-600"
                />
                <span className="text-sm text-gray-400">minutes</span>
                <Button
                  size="sm"
                  onClick={() => {
                    const seconds = customCountdownMinutes * 60
                    setCountdownTime(seconds)
                    startCountdown(seconds)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Timer className="w-4 h-4 mr-1" />
                  Start
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCountdownTime(300)
                    startCountdown(300)
                  }}
                  className="bg-gray-800 border-gray-600 hover:bg-gray-700"
                >
                  5 min
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCountdownTime(600)
                    startCountdown(600)
                  }}
                  className="bg-gray-800 border-gray-600 hover:bg-gray-700"
                >
                  10 min
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCountdownTime(900)
                    startCountdown(900)
                  }}
                  className="bg-gray-800 border-gray-600 hover:bg-gray-700"
                >
                  15 min
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCountdownTime(1800)
                    startCountdown(1800)
                  }}
                  className="bg-gray-800 border-gray-600 hover:bg-gray-700"
                >
                  30 min
                </Button>
              </div>
            </div>
          </div>

          {/* Setlist Overview */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="text-lg font-semibold mb-4 text-gray-300">SETLIST</div>
            <div className="space-y-2">
              {currentSetlist.items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => goToItem(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === currentItemIndex
                      ? 'bg-blue-600 text-white'
                      : index < currentItemIndex
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono w-6">{index + 1}</span>
                    {getItemIcon(item.type)}
                    <span className="text-sm font-medium truncate">{item.title}</span>
                  </div>
                  {(item.duration || 0) > 0 && (
                    <div className="text-xs text-gray-400 ml-8">
                      {formatTime(item.duration || 0)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Overlay */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Keyboard className="w-6 h-6" />
                Keyboard Shortcuts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardHelp(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-300 mb-3">Navigation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Item</span>
                    <div className="flex gap-1">
                      <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">→</kbd>
                      <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">Space</kbd>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Previous Item</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">←</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Go to Item 1-9</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">1-9</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">End Presentation</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">Esc</kbd>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-300 mb-3">Timer Controls</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Play/Pause Timer</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">P</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stop Timer</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">5 min Timer</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">1</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">10 min Timer</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">2</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">15 min Timer</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">3</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">30 min Timer</span>
                    <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">4</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Show/Hide Help</span>
                <div className="flex gap-1">
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">H</kbd>
                  <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">?</kbd>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs text-gray-500">
                Keyboard shortcuts are disabled when typing in input fields
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
