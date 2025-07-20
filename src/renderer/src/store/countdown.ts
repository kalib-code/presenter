/**
 * Countdown Store
 * 
 * Zustand store for managing countdown state including
 * active countdowns, timer state, and countdown management.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { CountdownConfig, CountdownState } from '@renderer/types/countdown-config'

/**
 * Active countdown interface
 */
export interface ActiveCountdown {
  id: string
  config: CountdownConfig
  state: CountdownState
  startTime: number
  endTime: number
}

/**
 * Countdown store state interface
 */
export interface CountdownStoreState {
  // Live countdown state
  liveCountdown: ActiveCountdown | null
  
  // Countdown management
  activeCountdowns: Map<string, ActiveCountdown>
  
  // Global countdown state
  isCountdownActive: boolean
  globalTimeLeft: number
  
  // Actions
  setLiveCountdown: (countdown: ActiveCountdown | null) => void
  startCountdown: (id: string, config: CountdownConfig) => void
  pauseCountdown: (id: string) => void
  resumeCountdown: (id: string) => void
  stopCountdown: (id: string) => void
  resetCountdown: (id: string) => void
  updateCountdownTime: (id: string, timeLeft: number) => void
  
  // Countdown creation
  createCountdown: (config: CountdownConfig) => string
  removeCountdown: (id: string) => void
  getCountdown: (id: string) => ActiveCountdown | null
  
  // Timer management
  startGlobalTimer: () => void
  stopGlobalTimer: () => void
  
  // Helper methods
  getAllActiveCountdowns: () => ActiveCountdown[]
  getCountdownById: (id: string) => ActiveCountdown | null
  isCountdownRunning: (id: string) => boolean
  getTimeRemaining: (id: string) => number
  
  // Cleanup
  clearAllCountdowns: () => void
  clearFinishedCountdowns: () => void
}

/**
 * Generate unique countdown ID
 */
const generateCountdownId = (): string => {
  return `countdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create countdown state from config
 */
const createCountdownState = (config: CountdownConfig): CountdownState => ({
  isRunning: false,
  timeLeft: config.duration || 300,
  originalDuration: config.duration || 300,
  isFinished: false,
  timerId: undefined
})

/**
 * Countdown store implementation
 */
export const useCountdownStore = create<CountdownStoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      liveCountdown: null,
      activeCountdowns: new Map(),
      isCountdownActive: false,
      globalTimeLeft: 0,

      // Basic setters
      setLiveCountdown: (countdown) => 
        set({ 
          liveCountdown: countdown,
          isCountdownActive: !!countdown,
          globalTimeLeft: countdown?.state.timeLeft || 0
        }, false, 'setLiveCountdown'),

      // Countdown management
      startCountdown: (id, config) => {
        const { activeCountdowns } = get()
        const existing = activeCountdowns.get(id)
        
        if (existing) {
          // Resume existing countdown
          const newState: CountdownState = {
            ...existing.state,
            isRunning: true,
            isFinished: false
          }
          
          const updatedCountdown: ActiveCountdown = {
            ...existing,
            state: newState
          }
          
          const newCountdowns = new Map(activeCountdowns)
          newCountdowns.set(id, updatedCountdown)
          
          set({ activeCountdowns: newCountdowns }, false, 'startCountdown')
          
          console.log('🕐 [COUNTDOWN_STORE] Resumed countdown:', id)
        } else {
          // Create new countdown
          const now = Date.now()
          const duration = (config.duration || 300) * 1000 // Convert to milliseconds
          
          const countdown: ActiveCountdown = {
            id,
            config,
            state: {
              ...createCountdownState(config),
              isRunning: true
            },
            startTime: now,
            endTime: now + duration
          }
          
          const newCountdowns = new Map(activeCountdowns)
          newCountdowns.set(id, countdown)
          
          set({ 
            activeCountdowns: newCountdowns,
            liveCountdown: countdown,
            isCountdownActive: true,
            globalTimeLeft: countdown.state.timeLeft
          }, false, 'startCountdown')
          
          console.log('🕐 [COUNTDOWN_STORE] Started new countdown:', id, config)
        }
      },
      
      pauseCountdown: (id) => {
        const { activeCountdowns } = get()
        const countdown = activeCountdowns.get(id)
        
        if (countdown && countdown.state.isRunning) {
          const newState: CountdownState = {
            ...countdown.state,
            isRunning: false
          }
          
          if (newState.timerId) {
            clearInterval(newState.timerId)
            newState.timerId = undefined
          }
          
          const updatedCountdown: ActiveCountdown = {
            ...countdown,
            state: newState
          }
          
          const newCountdowns = new Map(activeCountdowns)
          newCountdowns.set(id, updatedCountdown)
          
          set({ activeCountdowns: newCountdowns }, false, 'pauseCountdown')
          
          console.log('🕐 [COUNTDOWN_STORE] Paused countdown:', id)
        }
      },
      
      resumeCountdown: (id) => {
        const { startCountdown } = get()
        const countdown = get().activeCountdowns.get(id)
        
        if (countdown && !countdown.state.isRunning) {
          startCountdown(id, countdown.config)
          console.log('🕐 [COUNTDOWN_STORE] Resumed countdown:', id)
        }
      },
      
      stopCountdown: (id) => {
        const { activeCountdowns, liveCountdown } = get()
        const countdown = activeCountdowns.get(id)
        
        if (countdown) {
          if (countdown.state.timerId) {
            clearInterval(countdown.state.timerId)
          }
          
          const newCountdowns = new Map(activeCountdowns)
          newCountdowns.delete(id)
          
          const updates: Partial<CountdownStoreState> = {
            activeCountdowns: newCountdowns
          }
          
          // Clear live countdown if it's the one being stopped
          if (liveCountdown?.id === id) {
            updates.liveCountdown = null
            updates.isCountdownActive = false
            updates.globalTimeLeft = 0
          }
          
          set(updates, false, 'stopCountdown')
          
          console.log('🕐 [COUNTDOWN_STORE] Stopped countdown:', id)
        }
      },
      
      resetCountdown: (id) => {
        const { activeCountdowns } = get()
        const countdown = activeCountdowns.get(id)
        
        if (countdown) {
          const newState: CountdownState = {
            ...createCountdownState(countdown.config),
            isRunning: false
          }
          
          if (countdown.state.timerId) {
            clearInterval(countdown.state.timerId)
          }
          
          const updatedCountdown: ActiveCountdown = {
            ...countdown,
            state: newState,
            startTime: Date.now(),
            endTime: Date.now() + (countdown.config.duration || 300) * 1000
          }
          
          const newCountdowns = new Map(activeCountdowns)
          newCountdowns.set(id, updatedCountdown)
          
          set({ activeCountdowns: newCountdowns }, false, 'resetCountdown')
          
          console.log('🕐 [COUNTDOWN_STORE] Reset countdown:', id)
        }
      },
      
      updateCountdownTime: (id, timeLeft) => {
        const { activeCountdowns, liveCountdown } = get()
        const countdown = activeCountdowns.get(id)
        
        if (countdown) {
          const newState: CountdownState = {
            ...countdown.state,
            timeLeft,
            isFinished: timeLeft <= 0
          }
          
          const updatedCountdown: ActiveCountdown = {
            ...countdown,
            state: newState
          }
          
          const newCountdowns = new Map(activeCountdowns)
          newCountdowns.set(id, updatedCountdown)
          
          const updates: Partial<CountdownStoreState> = {
            activeCountdowns: newCountdowns
          }
          
          // Update global state if this is the live countdown
          if (liveCountdown?.id === id) {
            updates.globalTimeLeft = timeLeft
            updates.liveCountdown = updatedCountdown
            
            if (timeLeft <= 0) {
              updates.isCountdownActive = false
            }
          }
          
          set(updates, false, 'updateCountdownTime')
        }
      },

      // Countdown creation
      createCountdown: (config) => {
        const id = generateCountdownId()
        const now = Date.now()
        const duration = (config.duration || 300) * 1000
        
        const countdown: ActiveCountdown = {
          id,
          config,
          state: createCountdownState(config),
          startTime: now,
          endTime: now + duration
        }
        
        const { activeCountdowns } = get()
        const newCountdowns = new Map(activeCountdowns)
        newCountdowns.set(id, countdown)
        
        set({ activeCountdowns: newCountdowns }, false, 'createCountdown')
        
        console.log('🕐 [COUNTDOWN_STORE] Created countdown:', id)
        return id
      },
      
      removeCountdown: (id) => {
        const { stopCountdown } = get()
        stopCountdown(id)
      },
      
      getCountdown: (id) => {
        const { activeCountdowns } = get()
        return activeCountdowns.get(id) || null
      },

      // Timer management
      startGlobalTimer: () => {
        console.log('🕐 [COUNTDOWN_STORE] Starting global timer')
        set({ isCountdownActive: true }, false, 'startGlobalTimer')
      },
      
      stopGlobalTimer: () => {
        console.log('🕐 [COUNTDOWN_STORE] Stopping global timer')
        set({ 
          isCountdownActive: false,
          globalTimeLeft: 0 
        }, false, 'stopGlobalTimer')
      },

      // Helper methods
      getAllActiveCountdowns: () => {
        const { activeCountdowns } = get()
        return Array.from(activeCountdowns.values())
      },
      
      getCountdownById: (id) => {
        const { activeCountdowns } = get()
        return activeCountdowns.get(id) || null
      },
      
      isCountdownRunning: (id) => {
        const countdown = get().activeCountdowns.get(id)
        return countdown?.state.isRunning || false
      },
      
      getTimeRemaining: (id) => {
        const countdown = get().activeCountdowns.get(id)
        return countdown?.state.timeLeft || 0
      },

      // Cleanup
      clearAllCountdowns: () => {
        const { activeCountdowns } = get()
        
        // Clear all timers
        activeCountdowns.forEach((countdown) => {
          if (countdown.state.timerId) {
            clearInterval(countdown.state.timerId)
          }
        })
        
        set({
          activeCountdowns: new Map(),
          liveCountdown: null,
          isCountdownActive: false,
          globalTimeLeft: 0
        }, false, 'clearAllCountdowns')
        
        console.log('🕐 [COUNTDOWN_STORE] Cleared all countdowns')
      },
      
      clearFinishedCountdowns: () => {
        const { activeCountdowns } = get()
        const newCountdowns = new Map()
        
        activeCountdowns.forEach((countdown, id) => {
          if (!countdown.state.isFinished) {
            newCountdowns.set(id, countdown)
          } else if (countdown.state.timerId) {
            clearInterval(countdown.state.timerId)
          }
        })
        
        set({ activeCountdowns: newCountdowns }, false, 'clearFinishedCountdowns')
        
        console.log('🕐 [COUNTDOWN_STORE] Cleared finished countdowns')
      }
    }),
    {
      name: 'countdown-store',
      serialize: {
        options: {
          map: true
        }
      }
    }
  )
)