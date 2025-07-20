/**
 * UI Store
 * 
 * Zustand store for managing UI state including toggles,
 * dialogs, and other interface-related state.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * UI store state interface
 */
export interface UIStoreState {
  // UI toggles
  showRecentItems: boolean
  showTemplateDialog: boolean
  showSettingsDialog: boolean
  showMediaBrowser: boolean
  showCountdownConfig: boolean
  
  // Layout state
  sidebarCollapsed: boolean
  fullscreenMode: boolean
  
  // Loading states
  isLoading: boolean
  loadingMessage: string
  
  // Error state
  error: string | null
  
  // Modal states
  modalStack: string[]
  
  // Actions
  setShowRecentItems: (show: boolean) => void
  setShowTemplateDialog: (show: boolean) => void
  setShowSettingsDialog: (show: boolean) => void
  setShowMediaBrowser: (show: boolean) => void
  setShowCountdownConfig: (show: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setFullscreenMode: (fullscreen: boolean) => void
  setLoading: (loading: boolean, message?: string) => void
  setError: (error: string | null) => void
  
  // Modal management
  openModal: (modalId: string) => void
  closeModal: (modalId?: string) => void
  closeAllModals: () => void
  isModalOpen: (modalId: string) => boolean
  getTopModal: () => string | null
  
  // Convenience toggles
  toggleRecentItems: () => void
  toggleSidebar: () => void
  toggleFullscreen: () => void
  
  // Reset functions
  resetUIState: () => void
}

/**
 * UI store implementation
 */
export const useUIStore = create<UIStoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      showRecentItems: false,
      showTemplateDialog: false,
      showSettingsDialog: false,
      showMediaBrowser: false,
      showCountdownConfig: false,
      sidebarCollapsed: false,
      fullscreenMode: false,
      isLoading: false,
      loadingMessage: '',
      error: null,
      modalStack: [],

      // Basic setters
      setShowRecentItems: (show) => 
        set({ showRecentItems: show }, false, 'setShowRecentItems'),
        
      setShowTemplateDialog: (show) => 
        set({ showTemplateDialog: show }, false, 'setShowTemplateDialog'),
        
      setShowSettingsDialog: (show) => 
        set({ showSettingsDialog: show }, false, 'setShowSettingsDialog'),
        
      setShowMediaBrowser: (show) => 
        set({ showMediaBrowser: show }, false, 'setShowMediaBrowser'),
        
      setShowCountdownConfig: (show) => 
        set({ showCountdownConfig: show }, false, 'setShowCountdownConfig'),
        
      setSidebarCollapsed: (collapsed) => 
        set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),
        
      setFullscreenMode: (fullscreen) => 
        set({ fullscreenMode: fullscreen }, false, 'setFullscreenMode'),
        
      setLoading: (loading, message = '') => 
        set({ 
          isLoading: loading, 
          loadingMessage: message 
        }, false, 'setLoading'),
        
      setError: (error) => 
        set({ error }, false, 'setError'),

      // Modal management
      openModal: (modalId) => 
        set((state) => ({
          modalStack: [...state.modalStack, modalId]
        }), false, 'openModal'),
        
      closeModal: (modalId) => 
        set((state) => {
          if (modalId) {
            // Close specific modal
            return {
              modalStack: state.modalStack.filter(id => id !== modalId)
            }
          } else {
            // Close top modal
            return {
              modalStack: state.modalStack.slice(0, -1)
            }
          }
        }, false, 'closeModal'),
        
      closeAllModals: () => 
        set({ modalStack: [] }, false, 'closeAllModals'),
        
      isModalOpen: (modalId) => {
        const { modalStack } = get()
        return modalStack.includes(modalId)
      },
      
      getTopModal: () => {
        const { modalStack } = get()
        return modalStack.length > 0 ? modalStack[modalStack.length - 1] : null
      },

      // Convenience toggles
      toggleRecentItems: () => 
        set((state) => ({ 
          showRecentItems: !state.showRecentItems 
        }), false, 'toggleRecentItems'),
        
      toggleSidebar: () => 
        set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        }), false, 'toggleSidebar'),
        
      toggleFullscreen: () => 
        set((state) => ({ 
          fullscreenMode: !state.fullscreenMode 
        }), false, 'toggleFullscreen'),

      // Reset functions
      resetUIState: () => 
        set({
          showRecentItems: false,
          showTemplateDialog: false,
          showSettingsDialog: false,
          showMediaBrowser: false,
          showCountdownConfig: false,
          sidebarCollapsed: false,
          fullscreenMode: false,
          isLoading: false,
          loadingMessage: '',
          error: null,
          modalStack: []
        }, false, 'resetUIState')
    }),
    {
      name: 'ui-store'
    }
  )
)