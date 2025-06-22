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
  type: 'grid' | 'element' | 'guide' | 'center'
  elementId?: string
}

interface AlignmentState {
  // Grid settings
  gridEnabled: boolean
  gridSize: number // Legacy: pixel-based grid size
  gridMode: 'pixel' | 'boxes' // New: grid mode selection
  gridBoxesX: number // New: number of boxes horizontally
  gridBoxesY: number // New: number of boxes vertically
  gridVisible: boolean
  gridColor: string
  gridOpacity: number

  // Snap settings
  snapToGrid: boolean
  snapToElements: boolean
  snapToGuides: boolean
  snapToCenter: boolean // New: snap to canvas center and element centers
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
  setGridMode: (mode: 'pixel' | 'boxes') => void
  setGridBoxes: (x: number, y: number) => void
  setGridVisible: (visible: boolean) => void
  setGridColor: (color: string) => void
  setGridOpacity: (opacity: number) => void

  // Snap controls
  setSnapToGrid: (enabled: boolean) => void
  setSnapToElements: (enabled: boolean) => void
  setSnapToGuides: (enabled: boolean) => void
  setSnapToCenter: (enabled: boolean) => void
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
  snapPosition: (
    position: { x: number; y: number },
    canvasSize: { width: number; height: number },
    elements: EditorElement[]
  ) => { x: number; y: number; snappedX: boolean; snappedY: boolean }
  getSnapPoints: (
    canvasSize: { width: number; height: number },
    elements: EditorElement[],
    excludeElementId?: string
  ) => SnapPoint[]

  // Element alignment
  alignElements: (
    elementIds: string[],
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ) => void
  distributeElements: (elementIds: string[], direction: 'horizontal' | 'vertical') => void

  // Utilities
  resetToDefaults: () => void
}

type AlignmentStore = AlignmentState & AlignmentActions

const initialState: AlignmentState = {
  // Grid settings - Disabled by default
  gridEnabled: false,
  gridSize: 20,
  gridMode: 'boxes',
  gridBoxesX: 10,
  gridBoxesY: 10,
  gridVisible: false,
  gridColor: '#E5E7EB',
  gridOpacity: 0.5,

  // Snap settings - Disabled by default
  snapToGrid: false,
  snapToElements: false,
  snapToGuides: false,
  snapToCenter: false,
  snapTolerance: 10,

  // Alignment guides - Disabled by default
  guides: [],
  showGuides: false,
  guideColor: '#3B82F6',
  guideOpacity: 0.8,

  // Smart guides - Disabled by default
  smartGuides: [],
  showSmartGuides: false,

  // Rulers - Disabled by default
  showRulers: false,
  rulerColor: '#6B7280',
  rulerUnit: 'px'
}

export const useAlignmentStore = create<AlignmentStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
    setGridSize: (size) => set({ gridSize: Math.max(5, Math.min(100, size)) }),
    setGridMode: (mode) => set({ gridMode: mode }),
    setGridBoxes: (x, y) =>
      set({
        gridBoxesX: Math.max(1, Math.min(50, x)),
        gridBoxesY: Math.max(1, Math.min(50, y))
      }),
    setGridVisible: (visible) => set({ gridVisible: visible }),
    setGridColor: (color) => set({ gridColor: color }),
    setGridOpacity: (opacity) => set({ gridOpacity: Math.max(0, Math.min(1, opacity)) }),

    setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
    setSnapToElements: (enabled) => set({ snapToElements: enabled }),
    setSnapToGuides: (enabled) => set({ snapToGuides: enabled }),
    setSnapToCenter: (enabled) => set({ snapToCenter: enabled }),
    setSnapTolerance: (tolerance) => set({ snapTolerance: Math.max(1, Math.min(50, tolerance)) }),

    addGuide: (type, position) => {
      const currentState = get()

      const guide: AlignmentGuide = {
        id: `guide_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type,
        position,
        color: currentState.guideColor,
        temporary: false
      }
      set((state) => ({ guides: [...state.guides, guide] }))

      // Verify the update
      const updatedState = get()
      console.log('🎯 [ALIGNMENT_STORE] After update, guides:', updatedState.guides)
    },

    removeGuide: (id) => {
      set((state) => ({ guides: state.guides.filter((guide) => guide.id !== id) }))
    },

    updateGuide: (id, position) => {
      set((state) => ({
        guides: state.guides.map((guide) => (guide.id === id ? { ...guide, position } : guide))
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

    snapPosition: (position, canvasSize, elements) => {
      const state = get()
      let { x, y } = position
      let snappedX = false
      let snappedY = false

      if (!state.gridEnabled) {
        return { x, y, snappedX, snappedY }
      }

      const snapTolerance = state.snapTolerance

      // Snap to grid
      if (state.snapToGrid) {
        if (state.gridMode === 'boxes') {
          // Box-based grid snapping
          const boxWidth = canvasSize.width / state.gridBoxesX
          const boxHeight = canvasSize.height / state.gridBoxesY

          // Find nearest grid intersection
          const gridX = Math.round(x / boxWidth) * boxWidth
          const gridY = Math.round(y / boxHeight) * boxHeight

          if (Math.abs(x - gridX) <= snapTolerance) {
            x = gridX
            snappedX = true
          }

          if (Math.abs(y - gridY) <= snapTolerance) {
            y = gridY
            snappedY = true
          }
        } else if (state.gridSize > 0) {
          // Legacy pixel-based grid snapping
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

      // Snap to canvas center
      if (state.snapToCenter) {
        const canvasCenterX = canvasSize.width / 2
        const canvasCenterY = canvasSize.height / 2

        if (!snappedX && Math.abs(x - canvasCenterX) <= snapTolerance) {
          x = canvasCenterX
          snappedX = true
        }

        if (!snappedY && Math.abs(y - canvasCenterY) <= snapTolerance) {
          y = canvasCenterY
          snappedY = true
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

          // Snap to element edges
          if (!snappedX) {
            if (Math.abs(x - elementLeft) <= snapTolerance) {
              x = elementLeft
              snappedX = true
            } else if (Math.abs(x - elementRight) <= snapTolerance) {
              x = elementRight
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
            }
          }

          // Snap to element centers (only if snapToCenter is enabled)
          if (state.snapToCenter) {
            if (!snappedX && Math.abs(x - elementCenterX) <= snapTolerance) {
              x = elementCenterX
              snappedX = true
            }

            if (!snappedY && Math.abs(y - elementCenterY) <= snapTolerance) {
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

      // Canvas center snap point
      if (state.snapToCenter) {
        snapPoints.push({
          x: canvasSize.width / 2,
          y: canvasSize.height / 2,
          type: 'center'
        } as SnapPoint)
      }

      // Grid snap points
      if (state.snapToGrid) {
        if (state.gridMode === 'boxes') {
          // Box-based grid snap points
          const boxWidth = canvasSize.width / state.gridBoxesX
          const boxHeight = canvasSize.height / state.gridBoxesY

          for (let i = 0; i <= state.gridBoxesX; i++) {
            for (let j = 0; j <= state.gridBoxesY; j++) {
              snapPoints.push({ x: i * boxWidth, y: j * boxHeight, type: 'grid' })
            }
          }
        } else if (state.gridSize > 0) {
          // Legacy pixel-based grid snap points
          for (let x = 0; x <= canvasSize.width; x += state.gridSize) {
            for (let y = 0; y <= canvasSize.height; y += state.gridSize) {
              snapPoints.push({ x, y, type: 'grid' })
            }
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
export const useGridEnabled = (): boolean => useAlignmentStore((state) => state.gridEnabled)
export const useGridSize = (): number => useAlignmentStore((state) => state.gridSize)
export const useGridMode = (): 'pixel' | 'boxes' => useAlignmentStore((state) => state.gridMode)
export const useGridBoxesX = (): number => useAlignmentStore((state) => state.gridBoxesX)
export const useGridBoxesY = (): number => useAlignmentStore((state) => state.gridBoxesY)
export const useGridVisible = (): boolean => useAlignmentStore((state) => state.gridVisible)
export const useGridColor = (): string => useAlignmentStore((state) => state.gridColor)
export const useGridOpacity = (): number => useAlignmentStore((state) => state.gridOpacity)

// Snap selectors
export const useSnapToGrid = (): boolean => useAlignmentStore((state) => state.snapToGrid)
export const useSnapToElements = (): boolean => useAlignmentStore((state) => state.snapToElements)
export const useSnapToGuides = (): boolean => useAlignmentStore((state) => state.snapToGuides)
export const useSnapToCenter = (): boolean => useAlignmentStore((state) => state.snapToCenter)
export const useSnapTolerance = (): number => useAlignmentStore((state) => state.snapTolerance)

// Guide selectors
export const useGuides = (): AlignmentGuide[] => useAlignmentStore((state) => state.guides)
export const useShowGuides = (): boolean => useAlignmentStore((state) => state.showGuides)
export const useGuideColor = (): string => useAlignmentStore((state) => state.guideColor)
export const useGuideOpacity = (): number => useAlignmentStore((state) => state.guideOpacity)
export const useSmartGuides = (): AlignmentGuide[] =>
  useAlignmentStore((state) => state.smartGuides)
export const useShowSmartGuides = (): boolean => useAlignmentStore((state) => state.showSmartGuides)

// Ruler selectors
export const useShowRulers = (): boolean => useAlignmentStore((state) => state.showRulers)
export const useRulerColor = (): string => useAlignmentStore((state) => state.rulerColor)
export const useRulerUnit = (): 'px' | 'cm' | 'in' => useAlignmentStore((state) => state.rulerUnit)
