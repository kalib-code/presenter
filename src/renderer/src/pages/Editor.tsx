import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Separator } from '@renderer/components/ui/separator'
import { useToast } from '@renderer/hooks/use-toast'
import { Toaster } from '@renderer/components/ui/toaster'
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Type,
  Image,
  Video,
  Music,
  FileText,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { useSongStore } from '@renderer/store/song'
import { saveFileToMedia } from '@renderer/utils/mediaUtils'
import type { Slide } from '@renderer/types/database'

type EditorMode = 'song' | 'slide'
type EditorAction = 'create' | 'edit'

interface EditorState {
  mode: EditorMode
  action: EditorAction
  itemId?: string
  currentSlideIndex: number
  zoom: number
  selectedElements: string[]
}

interface EditorElement {
  id: string
  type: 'text' | 'image' | 'video'
  position: { x: number; y: number }
  size: { width: number; height: number }
  content: string
  style: {
    fontSize: number
    fontFamily: string
    color: string
    backgroundColor: string
    textAlign: 'left' | 'center' | 'right'
    fontWeight: 'normal' | 'bold'
    fontStyle: 'normal' | 'italic'
    textShadow: string
    lineHeight: number
  }
}

export default function Editor(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { createSong, updateSong, getSong } = useSongStore()
  const { toast } = useToast()

  // Parse URL parameters
  const searchParams = new URLSearchParams(location.search)
  const mode = (searchParams.get('mode') as EditorMode) || 'song'
  const action = (searchParams.get('action') as EditorAction) || 'create'
  const itemId = searchParams.get('id') || undefined

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    mode,
    action,
    itemId,
    currentSlideIndex: 0,
    zoom: 100,
    selectedElements: []
  })

  // Content state
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [slides, setSlides] = useState<Slide[]>([])
  const [canvasElements, setCanvasElements] = useState<EditorElement[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [editingSlideTitle, setEditingSlideTitle] = useState<number | null>(null)
  const [tempSlideTitle, setTempSlideTitle] = useState('')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null)
  const [backgroundVideoBlob, setBackgroundVideoBlob] = useState<string | null>(null)

  const [backgroundOpacity, setBackgroundOpacity] = useState(1)
  const [videoPlaybackRate, setVideoPlaybackRate] = useState(1)
  const [globalBackgroundImage, setGlobalBackgroundImage] = useState<string | null>(null)
  const [globalBackgroundVideo, setGlobalBackgroundVideo] = useState<string | null>(null)
  const [globalBackgroundVideoBlob, setGlobalBackgroundVideoBlob] = useState<string | null>(null)

  const [globalBackgroundOpacity, setGlobalBackgroundOpacity] = useState(1)
  const [globalVideoPlaybackRate] = useState(1)

  // Initialize editor with default content
  useEffect(() => {
    if (action === 'create' && slides.length === 0) {
      // Add initial slide for new content
      const initialSlide: Slide = {
        id: Date.now().toString(),
        type: 'custom',
        title: mode === 'song' ? 'Verse 1' : 'Slide 1',
        content: '',
        elements: [],
        order: 0,
        notes: ''
      }
      setSlides([initialSlide])
    } else if (action === 'edit' && itemId && mode === 'song') {
      loadSong(itemId)
    }
  }, [action, itemId, mode])

  // Ensure video plays when backgroundVideo changes
  useEffect(() => {
    if (
      backgroundVideoBlob ||
      backgroundVideo ||
      globalBackgroundVideoBlob ||
      globalBackgroundVideo
    ) {
      console.log('Background video state changed, attempting to play')
      // Small delay to ensure video element is rendered
      setTimeout(() => {
        const videoElement = document.querySelector(
          '[data-canvas="true"] video'
        ) as HTMLVideoElement
        if (videoElement) {
          console.log('Found video element, attempting to play')
          videoElement.play().catch((err) => {
            console.error('Failed to play video:', err)
            // Try to play again after user interaction
            const playOnClick = (): void => {
              videoElement.play().catch((e) => console.error('Still failed to play:', e))
              document.removeEventListener('click', playOnClick)
            }
            document.addEventListener('click', playOnClick)
          })
        } else {
          console.log('Video element not found')
        }
      }, 100)
    }
  }, [backgroundVideoBlob, backgroundVideo, globalBackgroundVideoBlob, globalBackgroundVideo])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (backgroundVideoBlob) {
        URL.revokeObjectURL(backgroundVideoBlob)
      }
      if (globalBackgroundVideoBlob) {
        URL.revokeObjectURL(globalBackgroundVideoBlob)
      }
    }
  }, [backgroundVideoBlob, globalBackgroundVideoBlob])

  // Global mouse event handlers for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent): void => {
      if (isDragging && draggedElement) {
        const canvas = document.querySelector('[data-canvas="true"]') as HTMLElement
        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect()
          const mouseX = e.clientX - canvasRect.left
          const mouseY = e.clientY - canvasRect.top

          const newElements = canvasElements.map((element) => {
            if (element.id === draggedElement) {
              const newX = mouseX - dragOffset.x
              const newY = mouseY - dragOffset.y

              return {
                ...element,
                position: {
                  x: Math.max(0, Math.min(newX, 960 - element.size.width)),
                  y: Math.max(0, Math.min(newY, 540 - element.size.height))
                }
              }
            }
            return element
          })
          setCanvasElements(newElements)
        }
      } else if (isResizing && selectedElement && resizeHandle) {
        const canvas = document.querySelector('[data-canvas="true"]') as HTMLElement
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const mouseX = e.clientX - rect.left
          const mouseY = e.clientY - rect.top

          setCanvasElements((elements) =>
            elements.map((element) => {
              if (element.id === selectedElement) {
                let newWidth = element.size.width
                let newHeight = element.size.height
                let newX = element.position.x
                let newY = element.position.y

                const minWidth = 50
                const minHeight = 30

                switch (resizeHandle) {
                  case 'se': // Southeast (bottom-right)
                    newWidth = Math.max(minWidth, mouseX - element.position.x)
                    newHeight = Math.max(minHeight, mouseY - element.position.y)
                    break
                  case 'sw': // Southwest (bottom-left)
                    newWidth = Math.max(minWidth, element.position.x + element.size.width - mouseX)
                    newHeight = Math.max(minHeight, mouseY - element.position.y)
                    newX = element.position.x + element.size.width - newWidth
                    break
                  case 'ne': // Northeast (top-right)
                    newWidth = Math.max(minWidth, mouseX - element.position.x)
                    newHeight = Math.max(
                      minHeight,
                      element.position.y + element.size.height - mouseY
                    )
                    newY = element.position.y + element.size.height - newHeight
                    break
                  case 'nw': // Northwest (top-left)
                    newWidth = Math.max(minWidth, element.position.x + element.size.width - mouseX)
                    newHeight = Math.max(
                      minHeight,
                      element.position.y + element.size.height - mouseY
                    )
                    newX = element.position.x + element.size.width - newWidth
                    newY = element.position.y + element.size.height - newHeight
                    break
                  case 'n': // North (top)
                    newHeight = Math.max(
                      minHeight,
                      element.position.y + element.size.height - mouseY
                    )
                    newY = element.position.y + element.size.height - newHeight
                    break
                  case 's': // South (bottom)
                    newHeight = Math.max(minHeight, mouseY - element.position.y)
                    break
                  case 'e': // East (right)
                    newWidth = Math.max(minWidth, mouseX - element.position.x)
                    break
                  case 'w': // West (left)
                    newWidth = Math.max(minWidth, element.position.x + element.size.width - mouseX)
                    newX = element.position.x + element.size.width - newWidth
                    break
                }

                // Keep within canvas bounds
                newX = Math.max(0, Math.min(newX, 960 - newWidth))
                newY = Math.max(0, Math.min(newY, 540 - newHeight))
                newWidth = Math.min(newWidth, 960 - newX)
                newHeight = Math.min(newHeight, 540 - newY)

                return {
                  ...element,
                  position: { x: newX, y: newY },
                  size: { width: newWidth, height: newHeight }
                }
              }
              return element
            })
          )
        }
      }
    }

    const handleGlobalMouseUp = (): void => {
      setIsDragging(false)
      setDraggedElement(null)
      setDragOffset({ x: 0, y: 0 })
      setIsResizing(false)
      setResizeHandle(null)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [
    isDragging,
    draggedElement,
    dragOffset,
    canvasElements,
    isResizing,
    selectedElement,
    resizeHandle
  ])

  const loadSong = async (songId: string): Promise<void> => {
    try {
      const song = await getSong(songId)
      if (song) {
        setTitle(song.name)
        setArtist(song.artist || '')
        setSlides(song.slides)

        // Load global background if exists
        console.log('Loading global background:', song.globalBackground)
        if (song.globalBackground) {
          if (song.globalBackground.type === 'image') {
            console.log(
              'Loading global background image:',
              song.globalBackground.value.substring(0, 50) + '...'
            )
            setGlobalBackgroundImage(song.globalBackground.value)
            setGlobalBackgroundVideo(null)
            setGlobalBackgroundOpacity(song.globalBackground.opacity || 1)
          } else if (song.globalBackground.type === 'video') {
            console.log(
              'Loading global background video:',
              song.globalBackground.value.substring(0, 50) + '...'
            )
            setGlobalBackgroundVideo(song.globalBackground.value)
            setGlobalBackgroundImage(null)
            setGlobalBackgroundOpacity(song.globalBackground.opacity || 1)
            // Note: Global video playback rate is handled by the video element directly
          }
        } else {
          console.log('No global background found, clearing state')
          setGlobalBackgroundImage(null)
          setGlobalBackgroundVideo(null)
          setGlobalBackgroundOpacity(1)
        }

        // Load canvas elements from the first slide
        if (song.slides.length > 0) {
          const currentSlide = song.slides[0]

          // Load background if exists
          if (currentSlide.background?.type === 'image') {
            setBackgroundImage(currentSlide.background.value)
            setBackgroundVideo(null)
            setBackgroundOpacity(currentSlide.background.opacity || 1)
          } else if (currentSlide.background?.type === 'video') {
            setBackgroundVideo(currentSlide.background.value)
            setBackgroundImage(null)
            setBackgroundOpacity(currentSlide.background.opacity || 1)
            setVideoPlaybackRate(currentSlide.background.playbackRate || 1)
          }

          // Load elements if they exist
          if (currentSlide.elements.length > 0) {
            const elements = currentSlide.elements.map((el) => ({
              id: el.id,
              type: el.type as 'text' | 'image' | 'video',
              position: el.position,
              size: el.size,
              content: typeof el.content === 'string' ? el.content : '',
              style: {
                fontSize: el.style.fontSize || 32,
                fontFamily: el.style.fontFamily || 'Arial',
                color: el.style.color || '#FFFFFF',
                backgroundColor: el.style.backgroundColor || 'transparent',
                textAlign: (el.style.textAlign as 'left' | 'center' | 'right') || 'center',
                fontWeight: (el.style.fontWeight as 'normal' | 'bold') || 'bold',
                fontStyle: (el.style.fontStyle as 'normal' | 'italic') || 'normal',
                textShadow: el.style.shadow || '2px 2px 4px rgba(0,0,0,0.8)',
                lineHeight: 1.2
              }
            }))
            setCanvasElements(elements)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load song:', error)
    }
  }

  const handleSave = async (): Promise<void> => {
    try {
      // Always save current slide data before final save
      const updatedSlides = saveCurrentSlideData()
      setSlides(updatedSlides)

      if (mode === 'song') {
        if (action === 'create') {
          // Create song with just the name first
          const newSong = await createSong(title || 'Untitled Song')

          // Then update it with full data
          if (artist || canvasElements.length > 0) {
            const slideContent = canvasElements.map((el) => el.content).join(' ')
            const slideElements = canvasElements.map((el, index) => ({
              id: el.id,
              type: el.type,
              position: el.position,
              size: el.size,
              content: el.content,
              style: {
                fontSize: el.style.fontSize,
                fontFamily: el.style.fontFamily,
                color: el.style.color,
                backgroundColor: el.style.backgroundColor,
                textAlign: el.style.textAlign,
                fontWeight: el.style.fontWeight,
                fontStyle: el.style.fontStyle,
                textShadow: el.style.textShadow,
                lineHeight: el.style.lineHeight,
                borderColor: '#000000',
                borderWidth: 0,
                borderRadius: 0,
                opacity: 1,
                rotation: 0,
                shadow: el.style.textShadow
              },
              zIndex: index,
              locked: false,
              visible: true
            }))

            const globalBg =
              globalBackgroundImage || globalBackgroundVideo
                ? {
                    type: globalBackgroundImage ? ('image' as const) : ('video' as const),
                    value: globalBackgroundImage || globalBackgroundVideo || '',
                    opacity: globalBackgroundOpacity,
                    playbackRate: globalBackgroundVideo ? globalVideoPlaybackRate : undefined
                  }
                : undefined

            console.log('Saving global background (create):', {
              hasGlobalImage: !!globalBackgroundImage,
              hasGlobalVideo: !!globalBackgroundVideo,
              globalBackground: globalBg
                ? {
                    type: globalBg.type,
                    valueLength: globalBg.value.length,
                    opacity: globalBg.opacity
                  }
                : undefined
            })

            await updateSong(newSong.id, {
              artist: artist || undefined,
              lyrics: slideContent,
              globalBackground: globalBg,
              slides: updatedSlides.map((slide, index) => {
                const isCurrentSlide = index === editorState.currentSlideIndex
                const slideBackground = isCurrentSlide
                  ? backgroundImage || backgroundVideo
                    ? {
                        type: backgroundImage ? ('image' as const) : ('video' as const),
                        value: backgroundImage || backgroundVideo || '',
                        opacity: backgroundOpacity,
                        playbackRate: backgroundVideo ? videoPlaybackRate : undefined
                      }
                    : undefined // For current slide, explicitly set to undefined if no background
                  : slide.background // For other slides, keep existing background

                if (isCurrentSlide) {
                  console.log(
                    `Saving slide ${index} background:`,
                    slideBackground
                      ? {
                          type: slideBackground.type,
                          hasValue: !!slideBackground.value,
                          valueLength: slideBackground.value?.length || 0,
                          opacity: slideBackground.opacity
                        }
                      : 'undefined'
                  )
                }

                return {
                  ...slide,
                  content: isCurrentSlide ? slideContent : slide.content,
                  elements: isCurrentSlide ? slideElements : slide.elements,
                  background: slideBackground
                }
              })
            })
          }
        } else if (itemId) {
          const slideContent = canvasElements.map((el) => el.content).join(' ')
          const slideElements = canvasElements.map((el, index) => ({
            id: el.id,
            type: el.type,
            position: el.position,
            size: el.size,
            content: el.content,
            style: {
              fontSize: el.style.fontSize,
              fontFamily: el.style.fontFamily,
              color: el.style.color,
              backgroundColor: el.style.backgroundColor,
              textAlign: el.style.textAlign,
              fontWeight: el.style.fontWeight,
              fontStyle: el.style.fontStyle,
              textShadow: el.style.textShadow,
              lineHeight: el.style.lineHeight,
              borderColor: '#000000',
              borderWidth: 0,
              borderRadius: 0,
              opacity: 1,
              rotation: 0,
              shadow: el.style.textShadow
            },
            zIndex: index,
            locked: false,
            visible: true
          }))

          const globalBg =
            globalBackgroundImage || globalBackgroundVideo
              ? {
                  type: globalBackgroundImage ? ('image' as const) : ('video' as const),
                  value: globalBackgroundImage || globalBackgroundVideo || '',
                  opacity: globalBackgroundOpacity,
                  playbackRate: globalBackgroundVideo ? globalVideoPlaybackRate : undefined
                }
              : undefined

          console.log('Saving global background (edit):', {
            hasGlobalImage: !!globalBackgroundImage,
            hasGlobalVideo: !!globalBackgroundVideo,
            globalBackground: globalBg
              ? {
                  type: globalBg.type,
                  valueLength: globalBg.value.length,
                  opacity: globalBg.opacity
                }
              : undefined
          })

          await updateSong(itemId, {
            name: title,
            artist: artist || undefined,
            lyrics: slideContent,
            globalBackground: globalBg,
            slides: updatedSlides.map((slide, index) => {
              const isCurrentSlide = index === editorState.currentSlideIndex
              const slideBackground = isCurrentSlide
                ? backgroundImage || backgroundVideo
                  ? {
                      type: backgroundImage ? ('image' as const) : ('video' as const),
                      value: backgroundImage || backgroundVideo || '',
                      opacity: backgroundOpacity,
                      playbackRate: backgroundVideo ? videoPlaybackRate : undefined
                    }
                  : undefined // For current slide, explicitly set to undefined if no background
                : slide.background // For other slides, keep existing background

              if (isCurrentSlide) {
                console.log(
                  `Saving slide ${index} background:`,
                  slideBackground
                    ? {
                        type: slideBackground.type,
                        hasValue: !!slideBackground.value,
                        valueLength: slideBackground.value?.length || 0,
                        opacity: slideBackground.opacity
                      }
                    : 'undefined'
                )
              }

              return {
                ...slide,
                content: isCurrentSlide ? slideContent : slide.content,
                elements: isCurrentSlide ? slideElements : slide.elements,
                background: slideBackground
              }
            })
          })
        }
      }

      // Show success toast instead of navigating
      toast({
        title: 'Success!',
        description: `${mode === 'song' ? 'Song' : 'Slide'} saved successfully.`
      })
    } catch (error) {
      console.error('Failed to save:', error)
      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to save. Please try again.',
        variant: 'destructive'
      })
    }
  }

  // Helper function to generate slide title based on mode and slide number
  const generateSlideTitle = (slideNumber: number): string => {
    if (mode === 'song') {
      // For songs, use verse numbering
      return `Verse ${slideNumber}`
    } else {
      // For slides, use slide numbering
      return `Slide ${slideNumber}`
    }
  }

  // Function to update a slide's title
  const updateSlideTitle = (slideIndex: number, newTitle: string): void => {
    const updatedSlides = slides.map((slide, index) => {
      if (index === slideIndex) {
        return { ...slide, title: newTitle }
      }
      return slide
    })
    setSlides(updatedSlides)
  }

  // Function to start editing a slide title
  const startEditingSlideTitle = (slideIndex: number): void => {
    setEditingSlideTitle(slideIndex)
    setTempSlideTitle(slides[slideIndex]?.title || '')
  }

  // Function to finish editing a slide title
  const finishEditingSlideTitle = (): void => {
    if (editingSlideTitle !== null && tempSlideTitle.trim()) {
      updateSlideTitle(editingSlideTitle, tempSlideTitle.trim())
    }
    setEditingSlideTitle(null)
    setTempSlideTitle('')
  }

  // Function to cancel editing a slide title
  const cancelEditingSlideTitle = (): void => {
    setEditingSlideTitle(null)
    setTempSlideTitle('')
  }

  // Function to auto-number all slides with proper titles
  const autoNumberSlides = (): void => {
    const updatedSlides = slides.map((slide, index) => ({
      ...slide,
      title: generateSlideTitle(index + 1)
    }))
    setSlides(updatedSlides)

    toast({
      title: 'Slides Renumbered',
      description: `All slides have been renumbered with ${mode === 'song' ? 'verse' : 'slide'} numbers.`
    })
  }

  // Helper function to save current slide data
  const saveCurrentSlideData = (): Slide[] => {
    return slides.map((slide, slideIndex) => {
      if (slideIndex === editorState.currentSlideIndex) {
        const slideContent = canvasElements.map((el) => el.content).join(' ')
        const slideElements = canvasElements.map((el, elIndex) => ({
          id: el.id,
          type: el.type,
          position: el.position,
          size: el.size,
          content: el.content,
          style: {
            fontSize: el.style.fontSize,
            fontFamily: el.style.fontFamily,
            color: el.style.color,
            backgroundColor: el.style.backgroundColor,
            textAlign: el.style.textAlign,
            fontWeight: el.style.fontWeight,
            fontStyle: el.style.fontStyle,
            textShadow: el.style.textShadow,
            lineHeight: el.style.lineHeight,
            borderColor: '#000000',
            borderWidth: 0,
            borderRadius: 0,
            opacity: 1,
            rotation: 0,
            shadow: el.style.textShadow
          },
          zIndex: elIndex,
          locked: false,
          visible: true
        }))
        return {
          ...slide,
          content: slideContent,
          elements: slideElements,
          background:
            backgroundImage || backgroundVideo
              ? {
                  type: backgroundImage ? ('image' as const) : ('video' as const),
                  value: backgroundImage || backgroundVideo || '',
                  opacity: backgroundOpacity,
                  playbackRate: backgroundVideo ? videoPlaybackRate : undefined
                }
              : undefined
        }
      }
      return slide
    })
  }

  const addSlide = (): void => {
    // Always save current slide data before adding new slide
    const updatedSlides = saveCurrentSlideData()

    const newSlide: Slide = {
      id: Date.now().toString(),
      type: 'custom',
      title: generateSlideTitle(updatedSlides.length + 1),
      content: '',
      elements: [],
      order: updatedSlides.length,
      notes: ''
    }

    const newSlides = [...updatedSlides, newSlide]
    setSlides(newSlides)

    // Switch to the new slide and clear canvas
    setEditorState((prev) => ({ ...prev, currentSlideIndex: updatedSlides.length }))
    setCanvasElements([])
    setBackgroundImage(null)
    setBackgroundVideo(null)
    setBackgroundVideoBlob(null)
    setBackgroundOpacity(1)
    setVideoPlaybackRate(1)
    setSelectedElement(null)
  }

  const deleteSlide = (index: number): void => {
    if (slides.length > 1) {
      const newSlides = slides.filter((_, i) => i !== index)
      setSlides(newSlides)
      setEditorState((prev) => ({
        ...prev,
        currentSlideIndex: Math.min(prev.currentSlideIndex, newSlides.length - 1)
      }))

      // Cancel any ongoing title editing
      if (editingSlideTitle !== null) {
        cancelEditingSlideTitle()
      }
    }
  }

  const addTextElement = (): void => {
    // Position new elements within the safe area (60px margin from sides, 40px from top/bottom)
    const safeX = 60 + Math.random() * (960 - 120 - 300) // Random X within safe area
    const safeY = 40 + Math.random() * (540 - 80 - 60) // Random Y within safe area

    const newElement: EditorElement = {
      id: Date.now().toString(),
      type: 'text',
      position: { x: Math.floor(safeX), y: Math.floor(safeY) },
      size: { width: 300, height: 60 },
      content: 'Click to edit text',
      style: {
        fontSize: 32,
        fontFamily: 'Arial',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        textAlign: 'center',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        lineHeight: 1.2
      }
    }
    setCanvasElements([...canvasElements, newElement])
    setSelectedElement(newElement.id)
  }

  const addImageElement = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      try {
        console.log('🖼️ Adding image element:', file.name)

        // Save file to media folder and get media reference
        const mediaReference = await saveFileToMedia(file)
        console.log('📸 Image saved with reference:', mediaReference)

        // Position new elements within the safe area
        const safeX = 60 + Math.random() * (960 - 120 - 200) // Random X within safe area
        const safeY = 40 + Math.random() * (540 - 80 - 150) // Random Y within safe area

        const newElement: EditorElement = {
          id: Date.now().toString(),
          type: 'image',
          position: { x: Math.floor(safeX), y: Math.floor(safeY) },
          size: { width: 200, height: 150 },
          content: mediaReference, // Store media reference instead of base64
          style: {
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            textAlign: 'center',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textShadow: 'none',
            lineHeight: 1.0
          }
        }
        setCanvasElements([...canvasElements, newElement])
        setSelectedElement(newElement.id)

        console.log('✅ Image element added successfully')
      } catch (error) {
        console.error('❌ Failed to add image element:', error)
      }
    }
    // Reset the input value so the same file can be selected again
    event.target.value = ''
  }

  const addVideoElement = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      try {
        console.log('🎬 Adding video element:', file.name)

        // Save file to media folder and get media reference
        const mediaReference = await saveFileToMedia(file)
        console.log('📹 Video saved with reference:', mediaReference)

        // Position new elements within the safe area
        const safeX = 60 + Math.random() * (960 - 120 - 320) // Random X within safe area
        const safeY = 40 + Math.random() * (540 - 80 - 180) // Random Y within safe area

        const newElement: EditorElement = {
          id: Date.now().toString(),
          type: 'video',
          position: { x: Math.floor(safeX), y: Math.floor(safeY) },
          size: { width: 320, height: 180 },
          content: mediaReference, // Store media reference instead of base64
          style: {
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            textAlign: 'center',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textShadow: 'none',
            lineHeight: 1.0
          }
        }
        setCanvasElements([...canvasElements, newElement])
        setSelectedElement(newElement.id)

        console.log('✅ Video element added successfully')
      } catch (error) {
        console.error('❌ Failed to add video element:', error)
      }
    }
    // Reset the input value so the same file can be selected again
    event.target.value = ''
  }

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string): void => {
    e.stopPropagation()
    const element = canvasElements.find((el) => el.id === elementId)
    if (element) {
      setSelectedElement(elementId)
      setDraggedElement(elementId)
      setDragOffset({
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY
      })
      setIsDragging(true)
    }
  }

  const updateElementContent = (elementId: string, content: string): void => {
    const newElements = canvasElements.map((element) => {
      if (element.id === elementId) {
        return { ...element, content }
      }
      return element
    })
    setCanvasElements(newElements)
  }

  const deleteElement = (elementId: string): void => {
    setCanvasElements(canvasElements.filter((el) => el.id !== elementId))
  }

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string): void => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      setSelectedElement(null)
      setEditorState((prev) => ({ ...prev, selectedElements: [] }))
    }
  }

  const handleBackgroundImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      try {
        console.log('🖼️ Uploading background image:', file.name)

        // Save file to media folder and get media reference
        const mediaReference = await saveFileToMedia(file)
        console.log('📸 Background image saved with reference:', mediaReference)

        setBackgroundImage(mediaReference)
        setBackgroundVideo(null) // Clear video when image is selected

        console.log('✅ Background image set successfully')
      } catch (error) {
        console.error('❌ Failed to upload background image:', error)
      }
    }
  }

  const handleBackgroundVideoUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      console.log('Video file selected:', file.name, file.type, file.size)

      // Check file size (limit to 50MB for performance)
      if (file.size > 50 * 1024 * 1024) {
        console.warn('Video file is large (>50MB), this may cause performance issues')
      }

      // Revoke previous blob URL to prevent memory leaks
      if (backgroundVideoBlob) {
        URL.revokeObjectURL(backgroundVideoBlob)
      }

      // Create blob URL for immediate playback
      const blobUrl = URL.createObjectURL(file)
      console.log('Video blob URL created:', blobUrl)
      setBackgroundVideoBlob(blobUrl)

      // Convert to base64 for persistence
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        console.log('Video converted to base64 for persistence')
        setBackgroundVideo(result)
      }
      reader.readAsDataURL(file)

      setBackgroundImage(null) // Clear image when video is selected
      setBackgroundOpacity(1) // Ensure full opacity for new video
      console.log('Background video state set')
    } else {
      console.log('Invalid file selected:', file?.type)
    }
    // Clear the input value so the same file can be selected again
    event.target.value = ''
  }

  const removeBackgroundImage = (): void => {
    console.log('Removing slide background image...')
    setBackgroundImage(null)
    setBackgroundOpacity(1)

    // Update the current slide's background to undefined
    const updatedSlides = slides.map((slide, index) => {
      if (index === editorState.currentSlideIndex) {
        return { ...slide, background: undefined }
      }
      return slide
    })
    setSlides(updatedSlides)
    console.log('Slide background image removed and slide updated')
  }

  const removeBackgroundVideo = (): void => {
    console.log('Removing slide background video...')
    // Revoke blob URL to prevent memory leaks
    if (backgroundVideoBlob) {
      URL.revokeObjectURL(backgroundVideoBlob)
    }
    setBackgroundVideo(null)
    setBackgroundVideoBlob(null)
    setBackgroundOpacity(1)

    // Update the current slide's background to undefined
    const updatedSlides = slides.map((slide, index) => {
      if (index === editorState.currentSlideIndex) {
        return { ...slide, background: undefined }
      }
      return slide
    })
    setSlides(updatedSlides)
    console.log('Slide background video removed and slide updated')
  }

  const updateVideoPlaybackRate = (rate: number): void => {
    setVideoPlaybackRate(rate)
    // Update all video elements immediately
    const videoElements = document.querySelectorAll('[data-canvas="true"] video')
    videoElements.forEach((video) => {
      ;(video as HTMLVideoElement).playbackRate = rate
    })
  }

  const handleGlobalBackgroundImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        console.log('🖼️ Uploading global background image:', file.name)

        // Save file to media folder and get media reference
        const mediaReference = await saveFileToMedia(file)
        console.log('📸 Global background image saved with reference:', mediaReference)

        setGlobalBackgroundImage(mediaReference)
        setGlobalBackgroundVideo(null) // Clear video when image is set

        console.log('✅ Global background image set successfully')
      } catch (error) {
        console.error('❌ Failed to upload global background image:', error)
      }
    }
    // Reset the input
    event.target.value = ''
  }

  const handleGlobalBackgroundVideoUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      console.log('Global video file selected:', file.name, file.type, file.size)

      // Check file size (limit to 50MB for performance)
      if (file.size > 50 * 1024 * 1024) {
        console.warn('Global video file is large (>50MB), this may cause performance issues')
      }

      // Revoke previous blob URL to prevent memory leaks
      if (globalBackgroundVideoBlob) {
        URL.revokeObjectURL(globalBackgroundVideoBlob)
      }

      // Create blob URL for immediate playback
      const blobUrl = URL.createObjectURL(file)
      console.log('Global video blob URL created:', blobUrl)
      setGlobalBackgroundVideoBlob(blobUrl)

      // Convert to base64 for persistence
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        console.log('Global video converted to base64 for persistence')
        setGlobalBackgroundVideo(result)
      }
      reader.readAsDataURL(file)

      setGlobalBackgroundImage(null) // Clear image when video is selected
      setGlobalBackgroundOpacity(1) // Ensure full opacity for new video
      console.log('Global background video state set')
    } else {
      console.log('Invalid global video file selected:', file?.type)
    }
    // Clear the input value so the same file can be selected again
    event.target.value = ''
  }

  const removeGlobalBackground = (): void => {
    console.log('Removing global background...')
    // Clean up blob URLs to prevent memory leaks
    if (globalBackgroundVideoBlob) {
      console.log('Revoking global background video blob URL')
      URL.revokeObjectURL(globalBackgroundVideoBlob)
    }
    setGlobalBackgroundImage(null)
    setGlobalBackgroundVideo(null)
    setGlobalBackgroundVideoBlob(null)
    setGlobalBackgroundOpacity(1)
    console.log('Global background removed successfully')
  }

  // Handle slide switching to load background and elements
  const switchToSlide = (slideIndex: number): void => {
    if (slideIndex >= 0 && slideIndex < slides.length) {
      // Always save current slide data before switching
      const updatedSlides = saveCurrentSlideData()
      setSlides(updatedSlides)

      const slide = updatedSlides[slideIndex]

      // Load background if exists
      if (slide.background?.type === 'image') {
        setBackgroundImage(slide.background.value)
        setBackgroundVideo(null)
        setBackgroundVideoBlob(null)
        setBackgroundOpacity(slide.background.opacity || 1)
        setVideoPlaybackRate(1) // Reset video playback rate for images
      } else if (slide.background?.type === 'video') {
        setBackgroundVideo(slide.background.value)
        setBackgroundImage(null)
        // Clear blob URL since we're loading from persistence (base64)
        setBackgroundVideoBlob(null)
        setBackgroundOpacity(slide.background.opacity || 1)
        setVideoPlaybackRate(slide.background.playbackRate || 1)
      } else {
        setBackgroundImage(null)
        setBackgroundVideo(null)
        setBackgroundVideoBlob(null)
        setBackgroundOpacity(1)
        setVideoPlaybackRate(1)
      }

      // Load elements if they exist
      if (slide.elements.length > 0) {
        const elements = slide.elements.map((el) => ({
          id: el.id,
          type: el.type as 'text' | 'image' | 'video',
          position: el.position,
          size: el.size,
          content: typeof el.content === 'string' ? el.content : '',
          style: {
            fontSize: el.style.fontSize || 32,
            fontFamily: el.style.fontFamily || 'Arial',
            color: el.style.color || '#FFFFFF',
            backgroundColor: el.style.backgroundColor || 'transparent',
            textAlign: (el.style.textAlign as 'left' | 'center' | 'right') || 'center',
            fontWeight: (el.style.fontWeight as 'normal' | 'bold') || 'bold',
            fontStyle: (el.style.fontStyle as 'normal' | 'italic') || 'normal',
            textShadow: el.style.textShadow || el.style.shadow || '2px 2px 4px rgba(0,0,0,0.8)',
            lineHeight: el.style.lineHeight || 1.2
          }
        }))
        setCanvasElements(elements)
      } else {
        setCanvasElements([])
      }

      setEditorState((prev) => ({ ...prev, currentSlideIndex: slideIndex }))
      setSelectedElement(null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/collection')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            {mode === 'song' ? <Music className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            <span className="font-semibold">
              {action === 'create' ? 'Create' : 'Edit'} {mode === 'song' ? 'Song' : 'Slide'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Redo className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Slide List */}
        <div className="w-64 border-r bg-muted/20 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-2">Slides</h3>
            <div className="space-y-2">
              <Button onClick={addSlide} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Slide
              </Button>
              {slides.length > 1 && mode === 'song' && (
                <Button
                  onClick={autoNumberSlides}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  Auto-Number Verses
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`p-2 mb-2 rounded border cursor-pointer transition-colors ${
                  index === editorState.currentSlideIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                }`}
                onClick={() => switchToSlide(index)}
              >
                <div className="flex items-center justify-between">
                  {editingSlideTitle === index ? (
                    <Input
                      value={tempSlideTitle}
                      onChange={(e) => setTempSlideTitle(e.target.value)}
                      onBlur={finishEditingSlideTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          finishEditingSlideTitle()
                        } else if (e.key === 'Escape') {
                          cancelEditingSlideTitle()
                        }
                      }}
                      className="text-sm h-6 px-1 py-0"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="text-sm font-medium cursor-pointer hover:underline flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditingSlideTitle(index)
                      }}
                    >
                      {slide.title}
                    </span>
                  )}
                  {slides.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSlide(index)
                      }}
                      className="h-6 w-6 p-0 ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="text-xs opacity-70 mt-1 line-clamp-2">
                  {slide.content || 'Empty slide'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Properties Panel */}
          <div className="p-4 border-b bg-muted/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={mode === 'song' ? 'Song title' : 'Slide title'}
                  className="mt-1"
                />
              </div>
              {mode === 'song' && (
                <div className="flex-1">
                  <label className="text-sm font-medium">Artist</label>
                  <Input
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Artist name"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Global Background Settings */}
            {mode === 'song' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">
                  Global Background (applies to all slides)
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGlobalBackgroundImageUpload}
                    className="hidden"
                    id="global-background-image-upload"
                  />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleGlobalBackgroundVideoUpload}
                    className="hidden"
                    id="global-background-video-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById('global-background-image-upload')?.click()
                    }
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Global Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById('global-background-video-upload')?.click()
                    }
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Global Video
                  </Button>
                  {(globalBackgroundImage || globalBackgroundVideo) && (
                    <Button variant="outline" size="sm" onClick={removeGlobalBackground}>
                      Remove Global BG
                    </Button>
                  )}
                  {(globalBackgroundImage || globalBackgroundVideo) && (
                    <div className="flex items-center gap-2 ml-4">
                      <label className="text-xs">Opacity:</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={globalBackgroundOpacity}
                        onChange={(e) => setGlobalBackgroundOpacity(Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-xs w-8">
                        {Math.round(globalBackgroundOpacity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="p-2 border-b bg-muted/5">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addTextElement}>
                <Type className="h-4 w-4 mr-2" />
                Text
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={addImageElement}
                className="hidden"
                id="element-image-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('element-image-upload')?.click()}
              >
                <Image className="h-4 w-4 mr-2" />
                Image
              </Button>
              <input
                type="file"
                accept="video/*"
                onChange={addVideoElement}
                className="hidden"
                id="element-video-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('element-video-upload')?.click()}
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundImageUpload}
                  className="hidden"
                  id="background-image-upload"
                />
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleBackgroundVideoUpload}
                  className="hidden"
                  id="background-video-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('background-image-upload')?.click()}
                >
                  <Image className="h-4 w-4 mr-2" />
                  BG Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('background-video-upload')?.click()}
                >
                  <Video className="h-4 w-4 mr-2" />
                  BG Video
                </Button>
                {(backgroundImage || backgroundVideo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      removeBackgroundImage()
                      removeBackgroundVideo()
                    }}
                  >
                    Remove BG
                  </Button>
                )}
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {editorState.zoom}%
                </span>
                <Button variant="outline" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-gray-800 p-8">
            <div className="mx-auto bg-black shadow-lg" style={{ width: '960px', height: '540px' }}>
              <div
                className="relative w-full h-full border-2 border-gray-600"
                data-canvas="true"
                onMouseDown={handleCanvasMouseDown}
                style={{
                  cursor: isDragging ? 'grabbing' : 'default',
                  backgroundImage: backgroundImage
                    ? `url(${backgroundImage})`
                    : !backgroundImage && !backgroundVideo && globalBackgroundImage
                      ? `url(${globalBackgroundImage})`
                      : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Background Video - only show if slide has video OR (no slide background at all AND global video exists) */}
                {(backgroundVideoBlob ||
                  backgroundVideo ||
                  (!backgroundImage &&
                    !backgroundVideo &&
                    (globalBackgroundVideoBlob || globalBackgroundVideo))) && (
                  <video
                    key={
                      (backgroundVideoBlob ||
                        backgroundVideo ||
                        globalBackgroundVideoBlob ||
                        globalBackgroundVideo) +
                      '_' +
                      editorState.currentSlideIndex
                    } // Force re-render when video changes
                    src={
                      backgroundVideoBlob ||
                      backgroundVideo ||
                      globalBackgroundVideoBlob ||
                      globalBackgroundVideo ||
                      ''
                    }
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls={false}
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{
                      opacity:
                        backgroundVideoBlob || backgroundVideo
                          ? backgroundOpacity
                          : globalBackgroundOpacity,
                      zIndex: 0 // Ensure video is behind other elements
                    }}
                    onLoadStart={() => {
                      const currentVideo =
                        backgroundVideoBlob ||
                        backgroundVideo ||
                        globalBackgroundVideoBlob ||
                        globalBackgroundVideo
                      const isUsingGlobal =
                        !(backgroundVideoBlob || backgroundVideo) &&
                        (globalBackgroundVideoBlob || globalBackgroundVideo)
                      const isUsingBlob = currentVideo?.startsWith('blob:')
                      console.log(
                        `Video loading started (${isUsingGlobal ? 'GLOBAL' : 'SLIDE'}):`,
                        isUsingBlob ? 'blob URL' : `data URL (${currentVideo?.length || 0} chars)`,
                        'opacity:',
                        backgroundVideoBlob || backgroundVideo
                          ? backgroundOpacity
                          : globalBackgroundOpacity
                      )
                    }}
                    onLoadedData={(e) => {
                      console.log('Video loaded successfully')
                      const video = e.target as HTMLVideoElement
                      video.playbackRate = videoPlaybackRate
                      video.play().catch((err) => console.error('Video play error:', err))
                    }}
                    onCanPlay={(e) => {
                      console.log('Video can play')
                      const video = e.target as HTMLVideoElement
                      video.playbackRate = videoPlaybackRate
                      video.play().catch((err) => console.error('Video play error:', err))
                    }}
                    onPlay={() => console.log('Video started playing')}
                    onPause={() => console.log('Video paused')}
                    onError={(e) => {
                      console.error('Video error:', e)
                      const video = e.target as HTMLVideoElement
                      const mediaError = video.error
                      console.error('Video error details:', {
                        error: mediaError,
                        errorCode: mediaError?.code,
                        errorMessage: mediaError?.message,
                        networkState: video.networkState,
                        readyState: video.readyState,
                        src: video.src.startsWith('blob:')
                          ? 'blob URL'
                          : video.src.substring(0, 100) + '...'
                      })

                      // Log MediaError codes for debugging
                      if (mediaError) {
                        const errorTypes = {
                          1: 'MEDIA_ERR_ABORTED',
                          2: 'MEDIA_ERR_NETWORK',
                          3: 'MEDIA_ERR_DECODE',
                          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
                        }
                        console.error(
                          'MediaError type:',
                          errorTypes[mediaError.code as keyof typeof errorTypes] || 'Unknown'
                        )
                      }
                    }}
                  />
                )}

                {/* Background overlay for opacity control - only show if opacity is less than 1 */}
                {((backgroundImage || backgroundVideo) && backgroundOpacity < 1) ||
                (!backgroundImage &&
                  !backgroundVideo &&
                  (globalBackgroundImage || globalBackgroundVideo) &&
                  globalBackgroundOpacity < 1) ? (
                  <div
                    className="absolute inset-0 bg-black pointer-events-none"
                    style={{
                      opacity:
                        backgroundImage || backgroundVideo
                          ? 1 - backgroundOpacity
                          : 1 - globalBackgroundOpacity
                    }}
                  />
                ) : null}
                {/* Safe Area Margin Guides */}
                <div
                  className="absolute border-2 border-dashed border-gray-500 pointer-events-none"
                  style={{
                    top: '40px',
                    left: '60px',
                    right: '60px',
                    bottom: '40px',
                    width: 'calc(100% - 120px)',
                    height: 'calc(100% - 80px)'
                  }}
                />
                {/* Canvas Elements */}
                {canvasElements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute border border-dashed group transition-all duration-200 ${
                      selectedElement === element.id
                        ? 'border-blue-400 border-2 cursor-move'
                        : 'border-gray-400 hover:border-gray-300 cursor-pointer'
                    }`}
                    style={{
                      left: element.position.x,
                      top: element.position.y,
                      width: element.size.width,
                      height: element.size.height
                    }}
                    onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        e.stopPropagation()
                        setSelectedElement(element.id)
                      }
                    }}
                  >
                    {element.type === 'text' && (
                      <div className="relative w-full h-full">
                        <div
                          className="w-full h-full flex items-center justify-center cursor-text"
                          style={{
                            fontSize: element.style.fontSize,
                            fontFamily: element.style.fontFamily,
                            color: element.style.color,
                            backgroundColor: element.style.backgroundColor,
                            textAlign: element.style.textAlign,
                            fontWeight: element.style.fontWeight,
                            fontStyle: element.style.fontStyle,
                            textShadow: element.style.textShadow,
                            lineHeight: element.style.lineHeight
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedElement(element.id)
                          }}
                        >
                          <textarea
                            value={element.content}
                            onChange={(e) => updateElementContent(element.id, e.target.value)}
                            className="bg-transparent border-none outline-none w-full h-full resize-none"
                            style={{
                              fontSize: element.style.fontSize,
                              fontFamily: element.style.fontFamily,
                              color: element.style.color,
                              backgroundColor: 'transparent',
                              fontWeight: element.style.fontWeight,
                              fontStyle: element.style.fontStyle,
                              lineHeight: element.style.lineHeight,
                              textAlign: element.style.textAlign,
                              textShadow: element.style.textShadow
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedElement(element.id)
                            }}
                            onFocus={() => {
                              setSelectedElement(element.id)
                            }}
                            placeholder="Type your text here..."
                          />
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => deleteElement(element.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        >
                          ×
                        </button>

                        {/* Resize handles - only show when selected */}
                        {selectedElement === element.id && (
                          <>
                            {/* Corner handles */}
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-nw-resize -top-1.5 -left-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-ne-resize -top-1.5 -right-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-sw-resize -bottom-1.5 -left-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-se-resize -bottom-1.5 -right-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                            />

                            {/* Edge handles */}
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-n-resize -top-1.5 left-1/2 transform -translate-x-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-s-resize -bottom-1.5 left-1/2 transform -translate-x-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-w-resize -left-1.5 top-1/2 transform -translate-y-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-e-resize -right-1.5 top-1/2 transform -translate-y-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {element.type === 'image' && (
                      <div className="relative w-full h-full">
                        <img
                          src={element.content}
                          alt="Slide element"
                          className="w-full h-full object-cover rounded"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedElement(element.id)
                          }}
                          draggable={false}
                        />
                        {/* Delete button */}
                        <button
                          onClick={() => deleteElement(element.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        >
                          ×
                        </button>

                        {/* Resize handles - only show when selected */}
                        {selectedElement === element.id && (
                          <>
                            {/* Corner handles */}
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-nw-resize -top-1.5 -left-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-ne-resize -top-1.5 -right-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-sw-resize -bottom-1.5 -left-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-se-resize -bottom-1.5 -right-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                            />

                            {/* Edge handles */}
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-n-resize -top-1.5 left-1/2 transform -translate-x-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-s-resize -bottom-1.5 left-1/2 transform -translate-x-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-w-resize -left-1.5 top-1/2 transform -translate-y-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-e-resize -right-1.5 top-1/2 transform -translate-y-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {element.type === 'video' && (
                      <div className="relative w-full h-full">
                        <video
                          src={element.content}
                          className="w-full h-full object-cover rounded"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedElement(element.id)
                          }}
                          controls
                          loop
                          muted
                          autoPlay
                        />
                        {/* Delete button */}
                        <button
                          onClick={() => deleteElement(element.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        >
                          ×
                        </button>

                        {/* Resize handles - only show when selected */}
                        {selectedElement === element.id && (
                          <>
                            {/* Corner handles */}
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-nw-resize -top-1.5 -left-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-ne-resize -top-1.5 -right-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-sw-resize -bottom-1.5 -left-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-se-resize -bottom-1.5 -right-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                            />

                            {/* Edge handles */}
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-n-resize -top-1.5 left-1/2 transform -translate-x-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-s-resize -bottom-1.5 left-1/2 transform -translate-x-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-w-resize -left-1.5 top-1/2 transform -translate-y-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                            />
                            <div
                              className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-e-resize -right-1.5 top-1/2 transform -translate-y-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors"
                              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Empty state */}
                {canvasElements.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-400 text-center">
                      <div className="text-2xl mb-2">📺</div>
                      <div>
                        Click &quot;Text&quot;, &quot;Image&quot;, or &quot;Video&quot; to add
                        elements to your slide
                      </div>
                      <div className="text-sm mt-1">16:9 Canvas (960×540)</div>
                      <div className="text-xs mt-2 opacity-75">
                        Dashed lines show safe area for content
                      </div>
                      {backgroundVideo && (
                        <div className="text-xs mt-2 text-blue-400">Background video loaded</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {(selectedElement || backgroundImage || backgroundVideo) && (
          <div className="w-80 border-l bg-muted/10 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold mb-2">
                {selectedElement
                  ? (() => {
                      const element = canvasElements.find((el) => el.id === selectedElement)
                      return element?.type === 'text'
                        ? 'Text Properties'
                        : element?.type === 'image'
                          ? 'Image Properties'
                          : element?.type === 'video'
                            ? 'Video Properties'
                            : 'Element Properties'
                    })()
                  : 'Background Properties'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedElement ? (
                (() => {
                  const element = canvasElements.find((el) => el.id === selectedElement)
                  if (!element) return null

                  return (
                    <>
                      {element.type === 'text' && (
                        <>
                          {/* Font Family */}
                          <div>
                            <label className="text-sm font-medium">Font Family</label>
                            <select
                              value={element.style.fontFamily}
                              onChange={(e) => {
                                const newElements = canvasElements.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, style: { ...el.style, fontFamily: e.target.value } }
                                    : el
                                )
                                setCanvasElements(newElements)
                              }}
                              className="w-full mt-1 p-2 border rounded"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Helvetica">Helvetica</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Verdana">Verdana</option>
                              <option value="Impact">Impact</option>
                              <option value="Comic Sans MS">Comic Sans MS</option>
                            </select>
                          </div>

                          {/* Font Size */}
                          <div>
                            <label className="text-sm font-medium">Font Size</label>
                            <input
                              type="range"
                              min="12"
                              max="120"
                              value={element.style.fontSize}
                              onChange={(e) => {
                                const newElements = canvasElements.map((el) =>
                                  el.id === selectedElement
                                    ? {
                                        ...el,
                                        style: { ...el.style, fontSize: parseInt(e.target.value) }
                                      }
                                    : el
                                )
                                setCanvasElements(newElements)
                              }}
                              className="w-full mt-1"
                            />
                            <div className="text-sm text-muted-foreground mt-1">
                              {element.style.fontSize}px
                            </div>
                          </div>

                          {/* Text Color */}
                          <div>
                            <label className="text-sm font-medium">Text Color</label>
                            <input
                              type="color"
                              value={element.style.color}
                              onChange={(e) => {
                                const newElements = canvasElements.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, style: { ...el.style, color: e.target.value } }
                                    : el
                                )
                                setCanvasElements(newElements)
                              }}
                              className="w-full mt-1 h-10 border rounded"
                            />
                          </div>

                          {/* Background Color */}
                          <div>
                            <label className="text-sm font-medium">Background Color</label>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="color"
                                value={
                                  element.style.backgroundColor === 'transparent'
                                    ? '#000000'
                                    : element.style.backgroundColor
                                }
                                onChange={(e) => {
                                  const newElements = canvasElements.map((el) =>
                                    el.id === selectedElement
                                      ? {
                                          ...el,
                                          style: { ...el.style, backgroundColor: e.target.value }
                                        }
                                      : el
                                  )
                                  setCanvasElements(newElements)
                                }}
                                className="flex-1 h-10 border rounded"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newElements = canvasElements.map((el) =>
                                    el.id === selectedElement
                                      ? {
                                          ...el,
                                          style: { ...el.style, backgroundColor: 'transparent' }
                                        }
                                      : el
                                  )
                                  setCanvasElements(newElements)
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>

                          {/* Text Alignment */}
                          <div>
                            <label className="text-sm font-medium">Text Alignment</label>
                            <div className="flex gap-1 mt-1">
                              {(['left', 'center', 'right'] as const).map((align) => (
                                <Button
                                  key={align}
                                  variant={
                                    element.style.textAlign === align ? 'default' : 'outline'
                                  }
                                  size="sm"
                                  onClick={() => {
                                    const newElements = canvasElements.map((el) =>
                                      el.id === selectedElement
                                        ? { ...el, style: { ...el.style, textAlign: align } }
                                        : el
                                    )
                                    setCanvasElements(newElements)
                                  }}
                                  className="flex-1"
                                >
                                  {align.charAt(0).toUpperCase() + align.slice(1)}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Font Weight & Style */}
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-sm font-medium">Weight</label>
                              <Button
                                variant={
                                  element.style.fontWeight === 'bold' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                  const newElements = canvasElements.map((el) =>
                                    el.id === selectedElement
                                      ? {
                                          ...el,
                                          style: {
                                            ...el.style,
                                            fontWeight: (element.style.fontWeight === 'bold'
                                              ? 'normal'
                                              : 'bold') as 'normal' | 'bold'
                                          }
                                        }
                                      : el
                                  )
                                  setCanvasElements(newElements)
                                }}
                                className="w-full mt-1"
                              >
                                Bold
                              </Button>
                            </div>
                            <div className="flex-1">
                              <label className="text-sm font-medium">Style</label>
                              <Button
                                variant={
                                  element.style.fontStyle === 'italic' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                  const newElements = canvasElements.map((el) =>
                                    el.id === selectedElement
                                      ? {
                                          ...el,
                                          style: {
                                            ...el.style,
                                            fontStyle: (element.style.fontStyle === 'italic'
                                              ? 'normal'
                                              : 'italic') as 'normal' | 'italic'
                                          }
                                        }
                                      : el
                                  )
                                  setCanvasElements(newElements)
                                }}
                                className="w-full mt-1"
                              >
                                Italic
                              </Button>
                            </div>
                          </div>

                          {/* Line Height */}
                          <div>
                            <label className="text-sm font-medium">Line Height</label>
                            <input
                              type="range"
                              min="0.8"
                              max="3"
                              step="0.1"
                              value={element.style.lineHeight}
                              onChange={(e) => {
                                const newElements = canvasElements.map((el) =>
                                  el.id === selectedElement
                                    ? {
                                        ...el,
                                        style: {
                                          ...el.style,
                                          lineHeight: parseFloat(e.target.value)
                                        }
                                      }
                                    : el
                                )
                                setCanvasElements(newElements)
                              }}
                              className="w-full mt-1"
                            />
                            <div className="text-sm text-muted-foreground mt-1">
                              {element.style.lineHeight}
                            </div>
                          </div>

                          {/* Text Shadow */}
                          <div>
                            <label className="text-sm font-medium">Text Shadow</label>
                            <div className="flex gap-2 mt-1">
                              <Button
                                variant={
                                  element.style.textShadow !== 'none' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                  const newElements = canvasElements.map((el) =>
                                    el.id === selectedElement
                                      ? {
                                          ...el,
                                          style: {
                                            ...el.style,
                                            textShadow:
                                              element.style.textShadow === 'none'
                                                ? '2px 2px 4px rgba(0,0,0,0.8)'
                                                : 'none'
                                          }
                                        }
                                      : el
                                  )
                                  setCanvasElements(newElements)
                                }}
                                className="flex-1"
                              >
                                {element.style.textShadow !== 'none'
                                  ? 'Remove Shadow'
                                  : 'Add Shadow'}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      {element.type === 'image' && (
                        <>
                          {/* Image Preview */}
                          <div>
                            <label className="text-sm font-medium">Image Preview</label>
                            <div className="mt-2 aspect-video bg-gray-100 rounded border overflow-hidden">
                              <img
                                src={element.content}
                                alt="Element preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {/* Image Opacity */}
                          <div>
                            <label className="text-sm font-medium">Opacity</label>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.1"
                              value={1} // You can add opacity to the style if needed
                              className="w-full mt-1"
                            />
                            <div className="text-sm text-muted-foreground mt-1">100%</div>
                          </div>
                        </>
                      )}

                      {element.type === 'video' && (
                        <>
                          {/* Video Preview */}
                          <div>
                            <label className="text-sm font-medium">Video Preview</label>
                            <div className="mt-2 aspect-video bg-gray-100 rounded border overflow-hidden">
                              <video
                                src={element.content}
                                className="w-full h-full object-cover"
                                controls
                              />
                            </div>
                          </div>

                          {/* Video Controls */}
                          <div>
                            <label className="text-sm font-medium">Video Controls</label>
                            <div className="mt-2 space-y-2">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                  Autoplay
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                  Loop
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                  Muted
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )
                })()
              ) : // Background Properties - show slide image OR global image (only if no slide background at all)
              backgroundImage || (!backgroundImage && !backgroundVideo && globalBackgroundImage) ? (
                <>
                  {/* Background Image Controls */}
                  <div>
                    <label className="text-sm font-medium">
                      {backgroundImage ? 'Slide Background Image' : 'Global Background Image'}
                    </label>
                    <div className="mt-2 space-y-2">
                      <div className="aspect-video bg-gray-100 rounded border overflow-hidden">
                        <img
                          src={backgroundImage || globalBackgroundImage || ''}
                          alt="Background preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {backgroundImage ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeBackgroundImage}
                          className="w-full"
                        >
                          Remove Slide Background
                        </Button>
                      ) : (
                        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                          Using global background. Add slide-specific background to override.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Background Opacity */}
                  <div>
                    <label className="text-sm font-medium">Background Opacity</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={backgroundImage ? backgroundOpacity : globalBackgroundOpacity}
                      onChange={(e) => {
                        if (backgroundImage) {
                          setBackgroundOpacity(parseFloat(e.target.value))
                        } else {
                          setGlobalBackgroundOpacity(parseFloat(e.target.value))
                        }
                      }}
                      className="w-full mt-1"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {Math.round(
                        (backgroundImage ? backgroundOpacity : globalBackgroundOpacity) * 100
                      )}
                      %
                    </div>
                  </div>

                  {/* Background Position */}
                  <div>
                    <label className="text-sm font-medium">Background Position</label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {[
                        { label: 'TL', value: 'top left' },
                        { label: 'TC', value: 'top center' },
                        { label: 'TR', value: 'top right' },
                        { label: 'ML', value: 'center left' },
                        { label: 'MC', value: 'center' },
                        { label: 'MR', value: 'center right' },
                        { label: 'BL', value: 'bottom left' },
                        { label: 'BC', value: 'bottom center' },
                        { label: 'BR', value: 'bottom right' }
                      ].map((pos) => (
                        <Button key={pos.value} variant="outline" size="sm" className="text-xs p-1">
                          {pos.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              ) : backgroundVideo ||
                (!backgroundImage && !backgroundVideo && globalBackgroundVideo) ? (
                <>
                  {/* Background Video Controls */}
                  <div>
                    <label className="text-sm font-medium">
                      {backgroundVideo ? 'Slide Background Video' : 'Global Background Video'}
                    </label>
                    <div className="mt-2 space-y-2">
                      <div className="aspect-video bg-gray-100 rounded border overflow-hidden">
                        <video
                          src={backgroundVideo || globalBackgroundVideo || ''}
                          className="w-full h-full object-cover"
                          controls
                        />
                      </div>
                      {backgroundVideo ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeBackgroundVideo}
                          className="w-full"
                        >
                          Remove Slide Background
                        </Button>
                      ) : (
                        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                          Using global background. Add slide-specific background to override.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Background Opacity */}
                  <div>
                    <label className="text-sm font-medium">Background Opacity</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={backgroundVideo ? backgroundOpacity : globalBackgroundOpacity}
                      onChange={(e) => {
                        if (backgroundVideo) {
                          setBackgroundOpacity(parseFloat(e.target.value))
                        } else {
                          setGlobalBackgroundOpacity(parseFloat(e.target.value))
                        }
                      }}
                      className="w-full mt-1"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {Math.round(
                        (backgroundVideo ? backgroundOpacity : globalBackgroundOpacity) * 100
                      )}
                      %
                    </div>
                  </div>

                  {/* Video Playback Speed */}
                  <div>
                    <label className="text-sm font-medium">Playback Speed</label>
                    <input
                      type="range"
                      min="0.25"
                      max="4"
                      step="0.25"
                      value={videoPlaybackRate}
                      onChange={(e) => updateVideoPlaybackRate(parseFloat(e.target.value))}
                      className="w-full mt-1"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {videoPlaybackRate}x speed
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[0.5, 1, 1.5, 2].map((speed) => (
                        <Button
                          key={speed}
                          variant={videoPlaybackRate === speed ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateVideoPlaybackRate(speed)}
                          className="flex-1 text-xs"
                        >
                          {speed}x
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  )
}
