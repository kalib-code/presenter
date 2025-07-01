import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { EditorElement } from './editor-canvas'
import type { SlideElement } from '@renderer/types/database'

export interface SlideTemplate {
  id: string
  name: string
  description: string
  category: 'worship' | 'presentation' | 'announcement' | 'custom'
  thumbnail?: string
  elements: Omit<SlideElement, 'id'>[] // Template elements without IDs
  tags: string[]
  isBuiltIn: boolean
  createdAt: number
  updatedAt: number
}

interface TemplateState {
  templates: SlideTemplate[]
  selectedTemplateId: string | null
  isTemplateModalOpen: boolean
  selectedCategory: string | 'all'
  searchQuery: string
}

interface TemplateActions {
  // Template management
  setTemplates: (templates: SlideTemplate[]) => void
  addTemplate: (template: Omit<SlideTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTemplate: (id: string, updates: Partial<SlideTemplate>) => void
  deleteTemplate: (id: string) => void
  duplicateTemplate: (id: string) => void

  // Template application
  applyTemplate: (templateId: string) => EditorElement[]
  createTemplateFromCurrentSlide: (
    name: string,
    description: string,
    category: SlideTemplate['category']
  ) => void

  // UI state
  selectTemplate: (id: string | null) => void
  setTemplateModalOpen: (open: boolean) => void
  setSelectedCategory: (category: string | 'all') => void
  setSearchQuery: (query: string) => void

  // Utilities
  getTemplateById: (id: string) => SlideTemplate | null
  getTemplatesByCategory: (category: string | 'all') => SlideTemplate[]
  searchTemplates: (query: string) => SlideTemplate[]
  getBuiltInTemplates: () => SlideTemplate[]
  getCustomTemplates: () => SlideTemplate[]

  // Initialization
  initialize: () => void
  reset: () => void
}

type TemplateStore = TemplateState & TemplateActions

// Built-in slide templates for worship presentations
const builtInTemplates: SlideTemplate[] = [
  {
    id: 'title-slide',
    name: 'Title Slide',
    description: 'Main title with subtitle for song introductions',
    category: 'worship',
    tags: ['title', 'song', 'worship'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [
      {
        type: 'text',
        position: { x: 80, y: 150 },
        size: { width: 800, height: 120 },
        content: 'Song Title',
        style: {
          fontSize: 64,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
          lineHeight: 1.1
        },
        zIndex: 1
      },
      {
        type: 'text',
        position: { x: 180, y: 280 },
        size: { width: 600, height: 60 },
        content: 'Artist Name',
        style: {
          fontSize: 32,
          fontFamily: 'Arial',
          color: '#E0E0E0',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'normal',
          fontStyle: 'italic',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          lineHeight: 1.2
        },
        zIndex: 2
      }
    ]
  },
  {
    id: 'verse-slide',
    name: 'Verse Layout',
    description: 'Standard verse layout with centered lyrics',
    category: 'worship',
    tags: ['verse', 'lyrics', 'song'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [
      {
        type: 'text',
        position: { x: 120, y: 180 },
        size: { width: 720, height: 180 },
        content: 'Verse lyrics go here\nLine by line\nCentered and readable',
        style: {
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          lineHeight: 1.3
        },
        zIndex: 1
      }
    ]
  },
  {
    id: 'chorus-slide',
    name: 'Chorus Layout',
    description: 'Emphasized chorus with larger text',
    category: 'worship',
    tags: ['chorus', 'lyrics', 'emphasis'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [
      {
        type: 'text',
        position: { x: 80, y: 160 },
        size: { width: 800, height: 200 },
        content: 'Chorus lyrics here\nBolder and more prominent\nFor congregation singing',
        style: {
          fontSize: 52,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'rgba(0,0,0,0.3)',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
          lineHeight: 1.25
        },
        zIndex: 1
      }
    ]
  },
  {
    id: 'bridge-slide',
    name: 'Bridge Layout',
    description: 'Bridge section with distinctive styling',
    category: 'worship',
    tags: ['bridge', 'lyrics', 'distinction'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [
      {
        type: 'text',
        position: { x: 160, y: 200 },
        size: { width: 640, height: 140 },
        content: 'Bridge lyrics\nOften more intimate\nDistinctive moment',
        style: {
          fontSize: 44,
          fontFamily: 'Arial',
          color: '#F0F0F0',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'normal',
          fontStyle: 'italic',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
          lineHeight: 1.4
        },
        zIndex: 1
      }
    ]
  },
  {
    id: 'announcement-simple',
    name: 'Simple Announcement',
    description: 'Clean announcement slide with title and details',
    category: 'announcement',
    tags: ['announcement', 'info', 'clean'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [
      {
        type: 'text',
        position: { x: 80, y: 120 },
        size: { width: 800, height: 80 },
        content: 'Announcement Title',
        style: {
          fontSize: 56,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          lineHeight: 1.2
        },
        zIndex: 1
      },
      {
        type: 'text',
        position: { x: 120, y: 220 },
        size: { width: 720, height: 200 },
        content: 'Details about the announcement\nDate, time, location\nAdditional information',
        style: {
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#E0E0E0',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
          lineHeight: 1.4
        },
        zIndex: 2
      }
    ]
  },
  {
    id: 'presentation-title',
    name: 'Presentation Title',
    description: 'Professional presentation title slide',
    category: 'presentation',
    tags: ['presentation', 'title', 'professional'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [
      {
        type: 'text',
        position: { x: 80, y: 180 },
        size: { width: 800, height: 100 },
        content: 'Presentation Title',
        style: {
          fontSize: 58,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          lineHeight: 1.2
        },
        zIndex: 1
      },
      {
        type: 'text',
        position: { x: 180, y: 300 },
        size: { width: 600, height: 50 },
        content: 'Subtitle or Speaker Name',
        style: {
          fontSize: 28,
          fontFamily: 'Arial',
          color: '#D0D0D0',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
          lineHeight: 1.3
        },
        zIndex: 2
      }
    ]
  },
  {
    id: 'two-column',
    name: 'Two Column Layout',
    description: 'Side-by-side content layout',
    category: 'presentation',
    tags: ['layout', 'columns', 'comparison'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [
      {
        type: 'text',
        position: { x: 80, y: 80 },
        size: { width: 800, height: 60 },
        content: 'Two Column Title',
        style: {
          fontSize: 44,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          lineHeight: 1.2
        },
        zIndex: 1
      },
      {
        type: 'text',
        position: { x: 80, y: 180 },
        size: { width: 360, height: 260 },
        content: 'Left Column\n\n• Point one\n• Point two\n• Point three',
        style: {
          fontSize: 32,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'rgba(0,0,0,0.2)',
          textAlign: 'left',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
          lineHeight: 1.4
        },
        zIndex: 2
      },
      {
        type: 'text',
        position: { x: 520, y: 180 },
        size: { width: 360, height: 260 },
        content: 'Right Column\n\n• Point one\n• Point two\n• Point three',
        style: {
          fontSize: 32,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          backgroundColor: 'rgba(0,0,0,0.2)',
          textAlign: 'left',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
          lineHeight: 1.4
        },
        zIndex: 3
      }
    ]
  }
]

const initialState: TemplateState = {
  templates: [...builtInTemplates],
  selectedTemplateId: null,
  isTemplateModalOpen: false,
  selectedCategory: 'all',
  searchQuery: ''
}

export const useTemplateStore = create<TemplateStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setTemplates: (templates) => {
      set({ templates })
    },

    addTemplate: (templateData) => {
      const now = Date.now()
      const newTemplate: SlideTemplate = {
        ...templateData,
        id: `template_${now}_${Math.random().toString(36).slice(2)}`,
        createdAt: now,
        updatedAt: now
      }

      set((state) => ({
        templates: [...state.templates, newTemplate]
      }))
    },

    updateTemplate: (id, updates) => {
      set((state) => ({
        templates: state.templates.map((template) =>
          template.id === id ? { ...template, ...updates, updatedAt: Date.now() } : template
        )
      }))
    },

    deleteTemplate: (id) => {
      const template = get().templates.find((t) => t.id === id)
      if (template?.isBuiltIn) {
        console.warn('Cannot delete built-in template:', id)
        return
      }

      set((state) => ({
        templates: state.templates.filter((template) => template.id !== id),
        selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId
      }))
    },

    duplicateTemplate: (id) => {
      const template = get().templates.find((t) => t.id === id)
      if (!template) return

      const duplicatedTemplate: SlideTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: `${template.name} (Copy)`,
        isBuiltIn: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      set((state) => ({
        templates: [...state.templates, duplicatedTemplate]
      }))
    },

    applyTemplate: (templateId) => {
      const template = get().templates.find((t) => t.id === templateId)
      if (!template) return []

      // Convert SlideElement to EditorElement and generate new IDs
      return template.elements.map((element, index) => ({
        id: `element_${Date.now()}_${index}_${Math.random().toString(36).slice(2)}`,
        type: element.type as 'text' | 'image' | 'video',
        position: element.position,
        size: element.size,
        content: typeof element.content === 'string' ? element.content : '',
        style: {
          fontSize: element.style.fontSize || 32,
          fontFamily: element.style.fontFamily || 'Arial',
          color: element.style.color || '#FFFFFF',
          backgroundColor: element.style.backgroundColor || 'transparent',
          textAlign: (element.style.textAlign as 'left' | 'center' | 'right') || 'center',
          fontWeight: (element.style.fontWeight as 'normal' | 'bold') || 'normal',
          fontStyle: (element.style.fontStyle as 'normal' | 'italic') || 'normal',
          textShadow: element.style.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
          lineHeight: element.style.lineHeight || 1.2
        },
        opacity: element.style.opacity || 1,
        rotation: 0,
        zIndex: element.zIndex
      })) as EditorElement[]
    },

    createTemplateFromCurrentSlide: (name, description, category) => {
      // Import canvas store dynamically to avoid circular dependencies
      const canvasStore = require('./editor-canvas').useCanvasStore
      const currentElements = canvasStore.getState().elements

      if (currentElements.length === 0) {
        console.warn('No elements to create template from')
        return
      }

      // Convert EditorElement to SlideElement format
      const templateElements = currentElements.map((element) => ({
        type: element.type,
        position: element.position,
        size: element.size,
        content: element.content,
        style: {
          fontFamily: element.style.fontFamily,
          fontSize: element.style.fontSize,
          fontWeight: element.style.fontWeight,
          fontStyle: element.style.fontStyle,
          textAlign: element.style.textAlign,
          color: element.style.color,
          backgroundColor: element.style.backgroundColor,
          opacity: element.opacity,
          lineHeight: element.style.lineHeight,
          textShadow: element.style.textShadow
        },
        zIndex: element.zIndex || 0
      }))

      get().addTemplate({
        name,
        description,
        category,
        elements: templateElements,
        tags: [category],
        isBuiltIn: false
      })
    },

    selectTemplate: (id) => {
      set({ selectedTemplateId: id })
    },

    setTemplateModalOpen: (open) => {
      set({ isTemplateModalOpen: open })
    },

    setSelectedCategory: (category) => {
      set({ selectedCategory: category })
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query })
    },

    getTemplateById: (id) => {
      return get().templates.find((template) => template.id === id) || null
    },

    getTemplatesByCategory: (category) => {
      const templates = get().templates
      if (category === 'all') return templates
      return templates.filter((template) => template.category === category)
    },

    searchTemplates: (query) => {
      const templates = get().templates
      if (!query.trim()) return templates

      const searchTerm = query.toLowerCase()
      return templates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm) ||
          template.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
      )
    },

    getBuiltInTemplates: () => {
      return get().templates.filter((template) => template.isBuiltIn)
    },

    getCustomTemplates: () => {
      return get().templates.filter((template) => !template.isBuiltIn)
    },

    initialize: () => {
      set({
        ...initialState,
        templates: [...builtInTemplates] // Reset to built-in templates
      })
    },

    reset: () => {
      set(initialState)
    }
  }))
)

// Performance-optimized selectors
export const useTemplates = (): SlideTemplate[] => useTemplateStore((state) => state.templates)

export const useTemplatesByCategory = (category: string | 'all'): SlideTemplate[] =>
  useTemplateStore((state) => state.getTemplatesByCategory(category))

export const useSelectedTemplate = (): SlideTemplate | null =>
  useTemplateStore((state) =>
    state.selectedTemplateId ? state.getTemplateById(state.selectedTemplateId) : null
  )

export const useTemplateModalState = (): {
  isOpen: boolean
  selectedCategory: string | 'all'
  searchQuery: string
} =>
  useTemplateStore((state) => ({
    isOpen: state.isTemplateModalOpen,
    selectedCategory: state.selectedCategory,
    searchQuery: state.searchQuery
  }))
