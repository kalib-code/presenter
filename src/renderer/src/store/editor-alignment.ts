import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { EditorElement } from './editor-canvas'

export interface AlignmentGuide {
  id: string
  type: 'horizontal' | 'vertical'
  position: number
  color: string
  temporary: boolean
}

export interface SnapPoint {
  x: number
  y: number
  type: 'grid' | 'element' | 'guide'
  elementId?: string
}

interface AlignmentState {
  // Grid settings
  gridEnabled: boolean
  gridSize: number
  gridVisible: boolean
  gridColor: string
  gridOpacity: number

  // Snap settings
  snapToGrid: boolean
  snapToElements: boolean
  snapToGuides: boolean
  snapTolerance: number

  // Alignment guides
  guides: AlignmentGuide[]
  showGuides: boolean
  guideColor: string
  guideOpacity: number

  // Smart guides (temporary guides that appear during dragging)
  smartGuides: AlignmentGuide[]
  showSmartGuides: boolean

  // Rulers
  showRulers: boolean
  rulerColor: string
  rulerUnit: 'px' | 'cm' | 'in'
}

interface AlignmentActions {
  // Grid controls
  setGridEnabled: (enabled: boolean) => void
  setGridSize: (size: number) => void
  setGridVisible: (visible: boolean) => void
  setGridColor: (color: string) => void
  setGridOpacity: (opacity: number) => void

  // Snap controls
  setSnapToGrid: (enabled: boolean) => void
  setSnapToElements: (enabled: boolean) => void
  setSnapToGuides: (enabled: boolean) => void
  setSnapTolerance: (tolerance: number) => void

  // Guide management
  addGuide: (type: 'horizontal' | 'vertical', position: number) => void
  removeGuide: (id: string) => void
  updateGuide: (id: string, position: number) => void
  clearGuides: () => void
  setShowGuides: (show: boolean) => void
  setGuideColor: (color: string) => void
  setGuideOpacity: (opacity: number) => void

  // Smart guides
  updateSmartGuides: (guides: AlignmentGuide[]) => void
  clearSmartGuides: () => void
  setShowSmartGuides: (show: boolean) => void

  // Ruler controls
  setShowRulers: (show: boolean) => void
  setRulerColor: (color: string) => void
  setRulerUnit: (unit: 'px' | 'cm' | 'in') => void

  // Snap calculations
  snapPosition: (position: { x: number; y: number }, canvasSize: { width: number; height: number }, elements: EditorElement[]) => { x: number; y: number; snappedX: boolean; snappedY: boolean }
  getSnapPoints: (canvasSize: { width: number; height: number }, elements: EditorElement[], excludeElementId?: string) => SnapPoint[]

  // Element alignment
  alignElements: (elementIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  distributeElements: (elementIds: string[], direction: 'horizontal' | 'vertical') => void

  // Utilities
  resetToDefaults: () => void
}

type AlignmentStore = AlignmentState & AlignmentActions

const initialState: AlignmentState = {
  // Grid settings
  gridEnabled: true,
  gridSize: 20,
  gridVisible: true,
  gridColor: '#E5E7EB',
  gridOpacity: 0.5,

  // Snap settings
  snapToGrid: true,
  snapToElements: true,
  snapToGuides: true,
  snapTolerance: 10,

  // Alignment guides
  guides: [],
  showGuides: true,
  guideColor: '#3B82F6',
  guideOpacity: 0.8,

  // Smart guides
  smartGuides: [],
  showSmartGuides: true,

  // Rulers
  showRulers: true,
  rulerColor: '#6B7280',
  rulerUnit: 'px'
}

export const useAlignmentStore = create<AlignmentStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
    setGridSize: (size) => set({ gridSize: Math.max(5, Math.min(100, size)) }),
    setGridVisible: (visible) => set({ gridVisible: visible }),
    setGridColor: (color) => set({ gridColor: color }),
    setGridOpacity: (opacity) => set({ gridOpacity: Math.max(0, Math.min(1, opacity)) }),

    setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
    setSnapToElements: (enabled) => set({ snapToElements: enabled }),
    setSnapToGuides: (enabled) => set({ snapToGuides: enabled }),
    setSnapTolerance: (tolerance) => set({ snapTolerance: Math.max(1, Math.min(50, tolerance)) }),

    addGuide: (type, position) => {
      const guide: AlignmentGuide = {
        id: `guide_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type,
        position,
        color: get().guideColor,
        temporary: false
      }
      set((state) => ({ guides: [...state.guides, guide] }))
    },

    removeGuide: (id) => {
      set((state) => ({ guides: state.guides.filter((guide) => guide.id !== id) }))
    },

    updateGuide: (id, position) => {
      set((state) => ({
        guides: state.guides.map((guide) => 
          guide.id === id ? { ...guide, position } : guide
        )
      }))
    },

    clearGuides: () => set({ guides: [] }),
    setShowGuides: (show) => set({ showGuides: show }),
    setGuideColor: (color) => set({ guideColor: color }),
    setGuideOpacity: (opacity) => set({ guideOpacity: Math.max(0, Math.min(1, opacity)) }),

    updateSmartGuides: (guides) => set({ smartGuides: guides }),
    clearSmartGuides: () => set({ smartGuides: [] }),
    setShowSmartGuides: (show) => set({ showSmartGuides: show }),

    setShowRulers: (show) => set({ showRulers: show }),
    setRulerColor: (color) => set({ rulerColor: color }),
    setRulerUnit: (unit) => set({ rulerUnit: unit }),

    snapPosition: (position, _canvasSize, elements) => {
      const state = get()
      let { x, y } = position
      let snappedX = false
      let snappedY = false

      if (!state.gridEnabled) {
        return { x, y, snappedX, snappedY }
      }

      const snapTolerance = state.snapTolerance

      // Snap to grid
      if (state.snapToGrid && state.gridSize > 0) {
        const gridX = Math.round(x / state.gridSize) * state.gridSize
        const gridY = Math.round(y / state.gridSize) * state.gridSize

        if (Math.abs(x - gridX) <= snapTolerance) {
          x = gridX
          snappedX = true
        }

        if (Math.abs(y - gridY) <= snapTolerance) {
          y = gridY
          snappedY = true
        }
      }

      // Snap to guides
      if (state.snapToGuides && state.guides.length > 0) {
        for (const guide of state.guides) {
          if (guide.type === 'vertical' && Math.abs(x - guide.position) <= snapTolerance) {
            x = guide.position
            snappedX = true
          } else if (guide.type === 'horizontal' && Math.abs(y - guide.position) <= snapTolerance) {
            y = guide.position
            snappedY = true
          }
        }
      }

      // Snap to elements
      if (state.snapToElements && elements.length > 0) {
        for (const element of elements) {
          const elementLeft = element.position.x
          const elementRight = element.position.x + element.size.width
          const elementTop = element.position.y
          const elementBottom = element.position.y + element.size.height
          const elementCenterX = element.position.x + element.size.width / 2
          const elementCenterY = element.position.y + element.size.height / 2

          // Snap to element edges and center
          if (!snappedX) {
            if (Math.abs(x - elementLeft) <= snapTolerance) {
              x = elementLeft
              snappedX = true
            } else if (Math.abs(x - elementRight) <= snapTolerance) {
              x = elementRight
              snappedX = true
            } else if (Math.abs(x - elementCenterX) <= snapTolerance) {
              x = elementCenterX
              snappedX = true
            }
          }

          if (!snappedY) {
            if (Math.abs(y - elementTop) <= snapTolerance) {
              y = elementTop
              snappedY = true
            } else if (Math.abs(y - elementBottom) <= snapTolerance) {
              y = elementBottom
              snappedY = true
            } else if (Math.abs(y - elementCenterY) <= snapTolerance) {
              y = elementCenterY
              snappedY = true
            }
          }
        }
      }

      return { x, y, snappedX, snappedY }
    },

    getSnapPoints: (canvasSize, elements, excludeElementId) => {
      const state = get()
      const snapPoints: SnapPoint[] = []

      // Grid snap points
      if (state.snapToGrid && state.gridSize > 0) {
        for (let x = 0; x <= canvasSize.width; x += state.gridSize) {
          for (let y = 0; y <= canvasSize.height; y += state.gridSize) {
            snapPoints.push({ x, y, type: 'grid' })
          }
        }
      }

      // Guide snap points
      if (state.snapToGuides) {
        for (const guide of state.guides) {
          if (guide.type === 'vertical') {
            for (let y = 0; y <= canvasSize.height; y += 10) {
              snapPoints.push({ x: guide.position, y, type: 'guide' })
            }
          } else {
            for (let x = 0; x <= canvasSize.width; x += 10) {
              snapPoints.push({ x, y: guide.position, type: 'guide' })
            }
          }
        }
      }

      // Element snap points
      if (state.snapToElements) {
        for (const element of elements) {
          if (element.id === excludeElementId) continue

          const left = element.position.x
          const right = element.position.x + element.size.width
          const top = element.position.y
          const bottom = element.position.y + element.size.height
          const centerX = element.position.x + element.size.width / 2
          const centerY = element.position.y + element.size.height / 2

          // Corner points
          snapPoints.push(
            { x: left, y: top, type: 'element', elementId: element.id },
            { x: right, y: top, type: 'element', elementId: element.id },
            { x: left, y: bottom, type: 'element', elementId: element.id },
            { x: right, y: bottom, type: 'element', elementId: element.id }
          )

          // Center points
          snapPoints.push(
            { x: centerX, y: top, type: 'element', elementId: element.id },
            { x: centerX, y: bottom, type: 'element', elementId: element.id },
            { x: left, y: centerY, type: 'element', elementId: element.id },
            { x: right, y: centerY, type: 'element', elementId: element.id },
            { x: centerX, y: centerY, type: 'element', elementId: element.id }
          )
        }
      }

      return snapPoints
    },

    alignElements: (elementIds, alignment) => {
      // This would integrate with the canvas store to align elements
      // Implementation would depend on how canvas store manages elements
      console.log('Aligning elements:', elementIds, 'to', alignment)
    },

    distributeElements: (elementIds, direction) => {
      // This would integrate with the canvas store to distribute elements
      // Implementation would depend on how canvas store manages elements
      console.log('Distributing elements:', elementIds, 'in', direction, 'direction')
    },

    resetToDefaults: () => {
      set(initialState)
    }
  }))
)

// Performance-optimized primitive selectors (no object creation)
// Grid selectors
export const useGridEnabled = () => useAlignmentStore(state => state.gridEnabled)
export const useGridSize = () => useAlignmentStore(state => state.gridSize)
export const useGridVisible = () => useAlignmentStore(state => state.gridVisible)
export const useGridColor = () => useAlignmentStore(state => state.gridColor)
export const useGridOpacity = () => useAlignmentStore(state => state.gridOpacity)

// Snap selectors
export const useSnapToGrid = () => useAlignmentStore(state => state.snapToGrid)
export const useSnapToElements = () => useAlignmentStore(state => state.snapToElements)
export const useSnapToGuides = () => useAlignmentStore(state => state.snapToGuides)
export const useSnapTolerance = () => useAlignmentStore(state => state.snapTolerance)

// Guide selectors
export const useGuides = () => useAlignmentStore(state => state.guides)
export const useShowGuides = () => useAlignmentStore(state => state.showGuides)
export const useGuideColor = () => useAlignmentStore(state => state.guideColor)
export const useGuideOpacity = () => useAlignmentStore(state => state.guideOpacity)
export const useSmartGuides = () => useAlignmentStore(state => state.smartGuides)
export const useShowSmartGuides = () => useAlignmentStore(state => state.showSmartGuides)

// Ruler selectors
export const useShowRulers = () => useAlignmentStore(state => state.showRulers)
export const useRulerColor = () => useAlignmentStore(state => state.rulerColor)
export const useRulerUnit = () => useAlignmentStore(state => state.rulerUnit)