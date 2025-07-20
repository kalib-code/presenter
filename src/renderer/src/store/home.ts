/**
 * Home Store
 *
 * Zustand store for managing Home component state including
 * setlist selection, content cards, and item selection.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ContentCard } from '@renderer/types/content-card'
import { ProjectionState } from '@renderer/types/home'
import type { Setlist, SetlistItem } from '@renderer/types/database'

/**
 * Home store state interface
 */
export interface HomeState {
  // Setlist management
  selectedSetlist: Setlist | null
  selectedItem: SetlistItem | null

  // Content cards management
  contentCards: ContentCard[]
  selectedCard: ContentCard | null
  selectedCardId: string | null

  // Projection state
  projectionState: ProjectionState

  // Actions
  setSelectedSetlist: (setlist: Setlist | null) => void
  setSelectedItem: (item: SetlistItem | null) => void
  setContentCards: (cards: ContentCard[]) => void
  setSelectedCard: (card: ContentCard | null) => void
  setSelectedCardId: (id: string | null) => void
  setProjectionState: (state: Partial<ProjectionState>) => void

  // Content card operations
  addContentCard: (card: ContentCard) => void
  updateContentCard: (id: string, updates: Partial<ContentCard>) => void
  removeContentCard: (id: string) => void
  reorderContentCards: (startIndex: number, endIndex: number) => void

  // Selection helpers
  selectCardById: (id: string) => void
  selectNextCard: () => void
  selectPreviousCard: () => void

  // Reset functions
  resetSelection: () => void
  resetAll: () => void
}

/**
 * Initial projection state
 */
const initialProjectionState: ProjectionState = {
  isProjecting: false,
  isBlank: false,
  showLogo: false,
  currentContent: '',
  currentTitle: ''
}

/**
 * Home store implementation
 */
export const useHomeStore = create<HomeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedSetlist: null,
      selectedItem: null,
      contentCards: [],
      selectedCard: null,
      selectedCardId: null,
      projectionState: initialProjectionState,

      // Basic setters
      setSelectedSetlist: (setlist) =>
        set({ selectedSetlist: setlist }, false, 'setSelectedSetlist'),

      setSelectedItem: (item) => set({ selectedItem: item }, false, 'setSelectedItem'),

      setContentCards: (cards) => set({ contentCards: cards }, false, 'setContentCards'),

      setSelectedCard: (card) =>
        set(
          {
            selectedCard: card,
            selectedCardId: card?.id || null
          },
          false,
          'setSelectedCard'
        ),

      setSelectedCardId: (id) => {
        const { contentCards } = get()
        const card = id ? contentCards.find((c) => c.id === id) || null : null
        set(
          {
            selectedCardId: id,
            selectedCard: card
          },
          false,
          'setSelectedCardId'
        )
      },

      setProjectionState: (state) =>
        set(
          (prev) => ({
            projectionState: { ...prev.projectionState, ...state }
          }),
          false,
          'setProjectionState'
        ),

      // Content card operations
      addContentCard: (card) =>
        set(
          (state) => ({
            contentCards: [...state.contentCards, card]
          }),
          false,
          'addContentCard'
        ),

      updateContentCard: (id, updates) =>
        set(
          (state) => ({
            contentCards: state.contentCards.map((card) =>
              card.id === id ? { ...card, ...updates } : card
            ),
            selectedCard:
              state.selectedCard?.id === id
                ? { ...state.selectedCard, ...updates }
                : state.selectedCard
          }),
          false,
          'updateContentCard'
        ),

      removeContentCard: (id) =>
        set(
          (state) => {
            const newCards = state.contentCards.filter((card) => card.id !== id)
            const wasSelected = state.selectedCardId === id

            return {
              contentCards: newCards,
              selectedCard: wasSelected ? null : state.selectedCard,
              selectedCardId: wasSelected ? null : state.selectedCardId
            }
          },
          false,
          'removeContentCard'
        ),

      reorderContentCards: (startIndex, endIndex) =>
        set(
          (state) => {
            const newCards = [...state.contentCards]
            const [reorderedItem] = newCards.splice(startIndex, 1)
            newCards.splice(endIndex, 0, reorderedItem)

            // Update order property
            newCards.forEach((card, index) => {
              card.order = index
            })

            return { contentCards: newCards }
          },
          false,
          'reorderContentCards'
        ),

      // Selection helpers
      selectCardById: (id) => {
        const { contentCards } = get()
        const card = contentCards.find((c) => c.id === id) || null
        set(
          {
            selectedCard: card,
            selectedCardId: id
          },
          false,
          'selectCardById'
        )
      },

      selectNextCard: () => {
        const { contentCards, selectedCardId } = get()
        if (contentCards.length === 0) return

        const currentIndex = selectedCardId
          ? contentCards.findIndex((c) => c.id === selectedCardId)
          : -1
        const nextIndex = (currentIndex + 1) % contentCards.length
        const nextCard = contentCards[nextIndex]

        set(
          {
            selectedCard: nextCard,
            selectedCardId: nextCard.id
          },
          false,
          'selectNextCard'
        )
      },

      selectPreviousCard: () => {
        const { contentCards, selectedCardId } = get()
        if (contentCards.length === 0) return

        const currentIndex = selectedCardId
          ? contentCards.findIndex((c) => c.id === selectedCardId)
          : 0
        const prevIndex = currentIndex <= 0 ? contentCards.length - 1 : currentIndex - 1
        const prevCard = contentCards[prevIndex]

        set(
          {
            selectedCard: prevCard,
            selectedCardId: prevCard.id
          },
          false,
          'selectPreviousCard'
        )
      },

      // Reset functions
      resetSelection: () =>
        set(
          {
            selectedCard: null,
            selectedCardId: null
          },
          false,
          'resetSelection'
        ),

      resetAll: () =>
        set(
          {
            selectedSetlist: null,
            selectedItem: null,
            contentCards: [],
            selectedCard: null,
            selectedCardId: null,
            projectionState: initialProjectionState
          },
          false,
          'resetAll'
        )
    }),
    {
      name: 'home-store',
      serialize: {
        options: {
          map: true
        }
      }
    }
  )
)
