import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface HistoryAction {
  id: string
  type: string
  timestamp: number
  description: string
  undo: () => void
  redo: () => void
}

interface HistoryState {
  actions: HistoryAction[]
  currentIndex: number
  maxHistorySize: number
  isUndoing: boolean
  isRedoing: boolean
}

interface HistoryActions {
  // Core history operations
  pushAction: (action: Omit<HistoryAction, 'id' | 'timestamp'>) => void
  undo: () => void
  redo: () => void

  // State queries
  canUndo: () => boolean
  canRedo: () => boolean
  getUndoDescription: () => string | null
  getRedoDescription: () => string | null

  // Management
  clear: () => void
  setMaxSize: (size: number) => void

  // Batch operations
  startBatch: () => void
  endBatch: (description: string) => void
}

type HistoryStore = HistoryState & HistoryActions

const initialState: HistoryState = {
  actions: [],
  currentIndex: -1,
  maxHistorySize: 50,
  isUndoing: false,
  isRedoing: false
}

let batchActions: Omit<HistoryAction, 'id' | 'timestamp'>[] = []
let isBatching = false

export const useHistoryStore = create<HistoryStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    pushAction: (action) => {
      if (get().isUndoing || get().isRedoing) return

      // If we're batching, collect actions
      if (isBatching) {
        batchActions.push(action)
        return
      }

      const state = get()
      const newAction: HistoryAction = {
        ...action,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now()
      }

      // Remove any actions after current index (when undoing then making new changes)
      const newActions = state.actions.slice(0, state.currentIndex + 1)
      newActions.push(newAction)

      // Limit history size
      if (newActions.length > state.maxHistorySize) {
        newActions.shift()
      } else {
        set({ currentIndex: state.currentIndex + 1 })
      }

      set({ actions: newActions })
    },

    undo: () => {
      const state = get()
      if (!state.canUndo()) return

      set({ isUndoing: true })

      try {
        const action = state.actions[state.currentIndex]
        action.undo()
        set({ currentIndex: state.currentIndex - 1 })
      } catch (error) {
        console.error('Undo failed:', error)
      } finally {
        set({ isUndoing: false })
      }
    },

    redo: () => {
      const state = get()
      if (!state.canRedo()) return

      set({ isRedoing: true })

      try {
        const action = state.actions[state.currentIndex + 1]
        action.redo()
        set({ currentIndex: state.currentIndex + 1 })
      } catch (error) {
        console.error('Redo failed:', error)
      } finally {
        set({ isRedoing: false })
      }
    },

    canUndo: () => {
      const state = get()
      return state.currentIndex >= 0 && !state.isUndoing && !state.isRedoing
    },

    canRedo: () => {
      const state = get()
      return state.currentIndex < state.actions.length - 1 && !state.isUndoing && !state.isRedoing
    },

    getUndoDescription: () => {
      const state = get()
      return state.canUndo() ? state.actions[state.currentIndex].description : null
    },

    getRedoDescription: () => {
      const state = get()
      return state.canRedo() ? state.actions[state.currentIndex + 1].description : null
    },

    clear: () => {
      set({
        actions: [],
        currentIndex: -1,
        isUndoing: false,
        isRedoing: false
      })
    },

    setMaxSize: (maxHistorySize) => {
      set({ maxHistorySize })
      const state = get()
      if (state.actions.length > maxHistorySize) {
        const newActions = state.actions.slice(-maxHistorySize)
        const newIndex = Math.min(state.currentIndex, newActions.length - 1)
        set({ actions: newActions, currentIndex: newIndex })
      }
    },

    startBatch: () => {
      isBatching = true
      batchActions = []
    },

    endBatch: (description) => {
      if (!isBatching || batchActions.length === 0) {
        isBatching = false
        batchActions = []
        return
      }

      const actions = [...batchActions]
      isBatching = false
      batchActions = []

      // Create a combined undo/redo action
      const batchAction: Omit<HistoryAction, 'id' | 'timestamp'> = {
        type: 'batch',
        description,
        undo: () => {
          // Undo in reverse order
          for (let i = actions.length - 1; i >= 0; i--) {
            actions[i].undo()
          }
        },
        redo: () => {
          // Redo in original order
          for (const action of actions) {
            action.redo()
          }
        }
      }

      get().pushAction(batchAction)
    }
  }))
)

// Utility function to create history actions
export const createHistoryAction = (
  type: string,
  description: string,
  undo: () => void,
  redo: () => void
): Omit<HistoryAction, 'id' | 'timestamp'> => ({
  type,
  description,
  undo,
  redo
})

// Selectors for performance
export const useHistoryStatus = () =>
  useHistoryStore((state) => ({
    canUndo: state.canUndo(),
    canRedo: state.canRedo(),
    undoDescription: state.getUndoDescription(),
    redoDescription: state.getRedoDescription(),
    isUndoing: state.isUndoing,
    isRedoing: state.isRedoing
  }))
