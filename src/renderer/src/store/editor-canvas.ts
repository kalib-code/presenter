import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useHistoryStore, createHistoryAction } from './editor-history'

export interface EditorElement {
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
  // Additional properties for different element types
  opacity?: number
  rotation?: number
  zIndex?: number
}

interface CanvasState {
  elements: EditorElement[]
  selectedElementId: string | null

  // Interaction state (local to component)
  isDragging: boolean
  draggedElementId: string | null
  dragOffset: { x: number; y: number }
  isResizing: boolean
  resizeHandle: string | null

  // Canvas settings
  canvasSize: { width: number; height: number }
  safeArea: { top: number; right: number; bottom: number; left: number }
}

interface CanvasActions {
  // Element management
  setElements: (elements: EditorElement[]) => void
  addElement: (type: EditorElement['type'], data?: Partial<EditorElement>) => void
  updateElement: (id: string, updates: Partial<EditorElement>) => void
  deleteElement: (id: string) => void
  duplicateElement: (id: string) => void

  // Element operations
  moveElement: (id: string, position: { x: number; y: number }) => void
  resizeElement: (id: string, size: { width: number; height: number }) => void
  updateElementContent: (id: string, content: string) => void
  updateElementStyle: (id: string, style: Partial<EditorElement['style']>) => void

  // Selection
  selectElement: (id: string | null) => void
  selectNextElement: () => void
  selectPreviousElement: () => void

  // Drag and resize state (component-local)
  setDragState: (
    isDragging: boolean,
    elementId?: string | null,
    offset?: { x: number; y: number }
  ) => void
  setResizeState: (isResizing: boolean, handle?: string | null) => void

  // Bulk operations
  deleteSelectedElements: () => void
  moveElementsToFront: (ids: string[]) => void
  moveElementsToBack: (ids: string[]) => void
  alignElements: (
    ids: string[],
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ) => void
  clearElements: () => void

  // Canvas settings
  setCanvasSize: (size: { width: number; height: number }) => void
  setSafeArea: (area: { top: number; right: number; bottom: number; left: number }) => void

  // Utilities
  getElementById: (id: string) => EditorElement | null
  getElementsInArea: (area: {
    x: number
    y: number
    width: number
    height: number
  }) => EditorElement[]

  // Initialization
  initialize: (elements?: EditorElement[]) => void
  reset: () => void
}

type CanvasStore = CanvasState & CanvasActions

const defaultElementStyles: EditorElement['style'] = {
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

const initialState: CanvasState = {
  elements: [],
  selectedElementId: null,
  isDragging: false,
  draggedElementId: null,
  dragOffset: { x: 0, y: 0 },
  isResizing: false,
  resizeHandle: null,
  canvasSize: { width: 960, height: 540 }, // 16:9 aspect ratio
  safeArea: { top: 40, right: 60, bottom: 40, left: 60 }
}

const generateElementPosition = (
  type: EditorElement['type'],
  canvasSize: { width: number; height: number },
  safeArea: { top: number; right: number; bottom: number; left: number }
): { position: { x: number; y: number }; size: { width: number; height: number } } => {
  const safeWidth = canvasSize.width - safeArea.left - safeArea.right
  const safeHeight = canvasSize.height - safeArea.top - safeArea.bottom

  let defaultSize: { width: number; height: number }

  switch (type) {
    case 'text':
      defaultSize = { width: 300, height: 60 }
      break
    case 'image':
      defaultSize = { width: 200, height: 150 }
      break
    case 'video':
      defaultSize = { width: 320, height: 180 }
      break
    default:
      defaultSize = { width: 200, height: 100 }
  }

  // Random position within safe area
  const maxX = Math.max(0, safeWidth - defaultSize.width)
  const maxY = Math.max(0, safeHeight - defaultSize.height)

  return {
    position: {
      x: safeArea.left + Math.floor(Math.random() * maxX),
      y: safeArea.top + Math.floor(Math.random() * maxY)
    },
    size: defaultSize
  }
}

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setElements: (elements) => {
      set({ elements })
    },

    addElement: (type, data = {}) => {
      const state = get()
      const { position, size } = generateElementPosition(type, state.canvasSize, state.safeArea)

      let defaultContent = ''
      switch (type) {
        case 'text':
          defaultContent = 'Click to edit text'
          break
        case 'image':
        case 'video':
          defaultContent = data.content || ''
          break
      }

      const newElement: EditorElement = {
        id: Date.now().toString(),
        type,
        position,
        size,
        content: defaultContent,
        style: { ...defaultElementStyles },
        opacity: 1,
        rotation: 0,
        zIndex: state.elements.length,
        ...data
      }

      const newElements = [...state.elements, newElement]

      // Create history action
      const historyAction = createHistoryAction(
        'add-element',
        `Add ${type} element`,
        () => {
          // Undo: remove the element
          const currentElements = get().elements
          set({
            elements: currentElements.filter((el) => el.id !== newElement.id),
            selectedElementId: null
          })
        },
        () => {
          // Redo: add the element back
          set({
            elements: newElements,
            selectedElementId: newElement.id
          })
        }
      )

      set({
        elements: newElements,
        selectedElementId: newElement.id
      })

      useHistoryStore.getState().pushAction(historyAction)
    },

    updateElement: (id, updates) => {
      const state = get()
      const elementIndex = state.elements.findIndex((el) => el.id === id)
      if (elementIndex === -1) return

      const oldElement = state.elements[elementIndex]
      const newElement = { ...oldElement, ...updates }
      const newElements = [...state.elements]
      newElements[elementIndex] = newElement

      // Create history action for significant updates (not for temporary drag/resize)
      if (!state.isDragging && !state.isResizing) {
        const historyAction = createHistoryAction(
          'update-element',
          `Update ${oldElement.type} element`,
          () => {
            // Undo: restore old element
            const currentElements = [...get().elements]
            const index = currentElements.findIndex((el) => el.id === id)
            if (index !== -1) {
              currentElements[index] = oldElement
              set({ elements: currentElements })
            }
          },
          () => {
            // Redo: apply new element
            const currentElements = [...get().elements]
            const index = currentElements.findIndex((el) => el.id === id)
            if (index !== -1) {
              currentElements[index] = newElement
              set({ elements: currentElements })
            }
          }
        )

        useHistoryStore.getState().pushAction(historyAction)
      }

      set({ elements: newElements })
    },

    deleteElement: (id) => {
      const state = get()
      const elementToDelete = state.elements.find((el) => el.id === id)
      if (!elementToDelete) return

      const newElements = state.elements.filter((el) => el.id !== id)

      // Create history action
      const historyAction = createHistoryAction(
        'delete-element',
        `Delete ${elementToDelete.type} element`,
        () => {
          // Undo: restore the element
          const currentElements = get().elements
          // Insert at original position to maintain z-order
          const insertIndex = elementToDelete.zIndex || currentElements.length
          const restoredElements = [
            ...currentElements.slice(0, insertIndex),
            elementToDelete,
            ...currentElements.slice(insertIndex)
          ]
          set({
            elements: restoredElements,
            selectedElementId: elementToDelete.id
          })
        },
        () => {
          // Redo: delete the element again
          set({
            elements: newElements,
            selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
          })
        }
      )

      set({
        elements: newElements,
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
      })

      useHistoryStore.getState().pushAction(historyAction)
    },

    duplicateElement: (id) => {
      const state = get()
      const elementToDuplicate = state.elements.find((el) => el.id === id)
      if (!elementToDuplicate) return

      const duplicatedElement: EditorElement = {
        ...elementToDuplicate,
        id: Date.now().toString(),
        position: {
          x: elementToDuplicate.position.x + 20,
          y: elementToDuplicate.position.y + 20
        },
        zIndex: state.elements.length
      }

      const newElements = [...state.elements, duplicatedElement]

      // Create history action
      const historyAction = createHistoryAction(
        'duplicate-element',
        `Duplicate ${elementToDuplicate.type} element`,
        () => {
          // Undo: remove the duplicated element
          const currentElements = get().elements
          set({
            elements: currentElements.filter((el) => el.id !== duplicatedElement.id),
            selectedElementId: elementToDuplicate.id
          })
        },
        () => {
          // Redo: add the duplicated element back
          set({
            elements: newElements,
            selectedElementId: duplicatedElement.id
          })
        }
      )

      set({
        elements: newElements,
        selectedElementId: duplicatedElement.id
      })

      useHistoryStore.getState().pushAction(historyAction)
    },

    moveElement: (id, position) => {
      get().updateElement(id, { position })
    },

    resizeElement: (id, size) => {
      get().updateElement(id, { size })
    },

    updateElementContent: (id, content) => {
      get().updateElement(id, { content })
    },

    updateElementStyle: (id, style) => {
      const element = get().elements.find((el) => el.id === id)
      if (element) {
        get().updateElement(id, { style: { ...element.style, ...style } })
      }
    },

    selectElement: (id) => {
      set({ selectedElementId: id })
    },

    selectNextElement: () => {
      const state = get()
      if (state.elements.length === 0) return

      const currentIndex = state.selectedElementId
        ? state.elements.findIndex((el) => el.id === state.selectedElementId)
        : -1

      const nextIndex = (currentIndex + 1) % state.elements.length
      set({ selectedElementId: state.elements[nextIndex].id })
    },

    selectPreviousElement: () => {
      const state = get()
      if (state.elements.length === 0) return

      const currentIndex = state.selectedElementId
        ? state.elements.findIndex((el) => el.id === state.selectedElementId)
        : 0

      const prevIndex = currentIndex <= 0 ? state.elements.length - 1 : currentIndex - 1
      set({ selectedElementId: state.elements[prevIndex].id })
    },

    setDragState: (isDragging, elementId = null, offset = { x: 0, y: 0 }) => {
      set({
        isDragging,
        draggedElementId: elementId,
        dragOffset: offset
      })
    },

    setResizeState: (isResizing, handle = null) => {
      set({ isResizing, resizeHandle: handle })
    },

    deleteSelectedElements: () => {
      const state = get()
      if (state.selectedElementId) {
        get().deleteElement(state.selectedElementId)
      }
    },

    moveElementsToFront: (ids) => {
      const state = get()
      const maxZ = Math.max(...state.elements.map((el) => el.zIndex || 0))

      useHistoryStore.getState().startBatch()

      ids.forEach((id, index) => {
        get().updateElement(id, { zIndex: maxZ + index + 1 })
      })

      useHistoryStore.getState().endBatch('Move elements to front')
    },

    moveElementsToBack: (ids) => {
      const state = get()
      const minZ = Math.min(...state.elements.map((el) => el.zIndex || 0))

      useHistoryStore.getState().startBatch()

      ids.forEach((id, index) => {
        get().updateElement(id, { zIndex: minZ - ids.length + index })
      })

      useHistoryStore.getState().endBatch('Move elements to back')
    },

    alignElements: (ids, alignment) => {
      const state = get()
      const elements = ids
        .map((id) => state.elements.find((el) => el.id === id))
        .filter(Boolean) as EditorElement[]
      if (elements.length < 2) return

      useHistoryStore.getState().startBatch()

      switch (alignment) {
        case 'left': {
          const leftmost = Math.min(...elements.map((el) => el.position.x))
          elements.forEach((el) =>
            get().updateElement(el.id, { position: { ...el.position, x: leftmost } })
          )
          break
        }
        case 'center': {
          const avgX =
            elements.reduce((sum, el) => sum + el.position.x + el.size.width / 2, 0) /
            elements.length
          elements.forEach((el) =>
            get().updateElement(el.id, {
              position: { ...el.position, x: avgX - el.size.width / 2 }
            })
          )
          break
        }
        case 'right': {
          const rightmost = Math.max(...elements.map((el) => el.position.x + el.size.width))
          elements.forEach((el) =>
            get().updateElement(el.id, {
              position: { ...el.position, x: rightmost - el.size.width }
            })
          )
          break
        }
        case 'top': {
          const topmost = Math.min(...elements.map((el) => el.position.y))
          elements.forEach((el) =>
            get().updateElement(el.id, { position: { ...el.position, y: topmost } })
          )
          break
        }
        case 'middle': {
          const avgY =
            elements.reduce((sum, el) => sum + el.position.y + el.size.height / 2, 0) /
            elements.length
          elements.forEach((el) =>
            get().updateElement(el.id, {
              position: { ...el.position, y: avgY - el.size.height / 2 }
            })
          )
          break
        }
        case 'bottom': {
          const bottommost = Math.max(...elements.map((el) => el.position.y + el.size.height))
          elements.forEach((el) =>
            get().updateElement(el.id, {
              position: { ...el.position, y: bottommost - el.size.height }
            })
          )
          break
        }
      }

      useHistoryStore.getState().endBatch(`Align elements ${alignment}`)
    },

    clearElements: () => {
      const state = get()
      if (state.elements.length === 0) return

      const oldElements = [...state.elements]

      // Create history action
      const historyAction = createHistoryAction(
        'clear-elements',
        'Clear all elements',
        () => {
          // Undo: restore all elements
          set({
            elements: oldElements,
            selectedElementId: null
          })
        },
        () => {
          // Redo: clear elements
          set({
            elements: [],
            selectedElementId: null
          })
        }
      )

      set({
        elements: [],
        selectedElementId: null
      })

      useHistoryStore.getState().pushAction(historyAction)
    },

    setCanvasSize: (canvasSize) => {
      set({ canvasSize })
    },

    setSafeArea: (safeArea) => {
      set({ safeArea })
    },

    getElementById: (id) => {
      return get().elements.find((el) => el.id === id) || null
    },

    getElementsInArea: (area) => {
      return get().elements.filter((el) => {
        const elRight = el.position.x + el.size.width
        const elBottom = el.position.y + el.size.height
        const areaRight = area.x + area.width
        const areaBottom = area.y + area.height

        return !(
          el.position.x > areaRight ||
          elRight < area.x ||
          el.position.y > areaBottom ||
          elBottom < area.y
        )
      })
    },

    initialize: (elements = []) => {
      set({
        elements,
        selectedElementId: null,
        isDragging: false,
        draggedElementId: null,
        dragOffset: { x: 0, y: 0 },
        isResizing: false,
        resizeHandle: null
      })
    },

    reset: () => {
      set(initialState)
    }
  }))
)

// Performance-optimized selectors
export const useSelectedElement = (): EditorElement | null =>
  useCanvasStore((state) =>
    state.selectedElementId
      ? state.elements.find((el) => el.id === state.selectedElementId) || null
      : null
  )

export const useCanvasElements = (): EditorElement[] => useCanvasStore((state) => state.elements)

export const useCanvasInteraction = (): {
  isDragging: boolean
  draggedElementId: string | null
  dragOffset: { x: number; y: number }
  isResizing: boolean
  resizeHandle: string | null
} =>
  useCanvasStore((state) => ({
    isDragging: state.isDragging,
    draggedElementId: state.draggedElementId,
    dragOffset: state.dragOffset,
    isResizing: state.isResizing,
    resizeHandle: state.resizeHandle
  }))

export const useCanvasSettings = (): {
  canvasSize: { width: number; height: number }
  safeArea: { top: number; right: number; bottom: number; left: number }
} =>
  useCanvasStore((state) => ({
    canvasSize: state.canvasSize,
    safeArea: state.safeArea
  }))
