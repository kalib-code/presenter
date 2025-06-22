import type {
  Song,
  Presentation,
  SlideElement,
  Slide,
  Background,
  ElementStyle,
  StylePreset
} from '@renderer/types/database'
import { SYSTEM_FONT_STACKS } from './fontUtils'

// Default style presets
export const DEFAULT_STYLE_PRESETS: StylePreset[] = [
  {
    id: 'default-text',
    name: 'Default Text',
    description: 'Standard text styling for lyrics and content',
    category: 'text',
    isBuiltIn: true,
    style: {
      fontSize: 32,
      fontFamily: SYSTEM_FONT_STACKS.sansSerif,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      lineHeight: 1.2,
      padding: 8,
      margin: 0,
      borderRadius: 0,
      border: 'none',
      opacity: 1,
      shadow: 'none'
    }
  },
  {
    id: 'title',
    name: 'Title',
    description: 'Large text for song titles and headings',
    category: 'title',
    isBuiltIn: true,
    style: {
      fontSize: 48,
      fontFamily: SYSTEM_FONT_STACKS.sansSerif,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
      lineHeight: 1.1,
      padding: 12,
      margin: 0,
      borderRadius: 0,
      border: 'none',
      opacity: 1,
      shadow: 'none'
    }
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    description: 'Medium text for verse labels and subtitles',
    category: 'subtitle',
    isBuiltIn: true,
    style: {
      fontSize: 24,
      fontFamily: SYSTEM_FONT_STACKS.serif,
      color: '#CCCCCC',
      backgroundColor: 'transparent',
      textAlign: 'center',
      fontWeight: 'normal',
      fontStyle: 'italic',
      textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
      lineHeight: 1.3,
      padding: 6,
      margin: 0,
      borderRadius: 0,
      border: 'none',
      opacity: 0.9,
      shadow: 'none'
    }
  }
]

// Migration functions
export function findMatchingStylePreset(style: ElementStyle): StylePreset {
  // Find the closest matching preset
  for (const preset of DEFAULT_STYLE_PRESETS) {
    if (isStyleSimilar(style, preset.style)) {
      return preset
    }
  }
  // Default fallback
  return DEFAULT_STYLE_PRESETS[0]
}

export function isStyleSimilar(
  style1: ElementStyle,
  style2: ElementStyle,
  threshold = 0.8
): boolean {
  const keys = Object.keys(style1) as (keyof ElementStyle)[]
  let matches = 0

  for (const key of keys) {
    if (style1[key] === style2[key]) {
      matches++
    }
  }

  return matches / keys.length >= threshold
}

export function getStyleDifferences(
  elementStyle: ElementStyle,
  presetStyle: ElementStyle
): Partial<ElementStyle> {
  const differences: Partial<ElementStyle> = {}

  for (const key in elementStyle) {
    const elementValue = elementStyle[key as keyof ElementStyle]
    const presetValue = presetStyle[key as keyof ElementStyle]

    if (elementValue !== presetValue) {
      differences[key as keyof ElementStyle] = elementValue as any
    }
  }

  return differences
}

export function isBackgroundIdentical(bg1?: Background, bg2?: Background): boolean {
  if (!bg1 && !bg2) return true
  if (!bg1 || !bg2) return false

  return (
    bg1.type === bg2.type &&
    bg1.value === bg2.value &&
    bg1.opacity === bg2.opacity &&
    bg1.blur === bg2.blur &&
    bg1.overlay === bg2.overlay &&
    bg1.playbackRate === bg2.playbackRate &&
    bg1.size === bg2.size &&
    bg1.position === bg2.position
  )
}

export function getBackgroundDifferences(
  slideBackground: Background,
  globalBackground?: Background
): Partial<Background> {
  if (!globalBackground) return slideBackground

  const differences: Partial<Background> = {}

  for (const key in slideBackground) {
    const slideValue = slideBackground[key as keyof Background]
    const globalValue = globalBackground[key as keyof Background]

    if (slideValue !== globalValue) {
      differences[key as keyof Background] = slideValue as any
    }
  }

  return differences
}

// Element migration
export function migrateSlideElement(element: SlideElement): SlideElement {
  if (element.stylePreset) {
    // Already migrated
    return element
  }

  const matchingPreset = findMatchingStylePreset(element.style)
  const overrides = getStyleDifferences(element.style, matchingPreset.style)

  return {
    ...element,
    stylePreset: matchingPreset.id,
    styleOverrides: Object.keys(overrides).length > 0 ? overrides : undefined
  }
}

// Slide migration
export function migrateSlide(slide: Slide, globalBackground?: Background): Slide {
  if (slide.useGlobalBackground !== undefined) {
    // Already migrated
    return slide
  }

  // Migrate background
  let useGlobalBackground = false
  let backgroundOverride: Partial<Background> | undefined

  if (!slide.background) {
    useGlobalBackground = true
  } else if (isBackgroundIdentical(slide.background, globalBackground)) {
    useGlobalBackground = true
  } else {
    useGlobalBackground = false
    backgroundOverride = getBackgroundDifferences(slide.background, globalBackground)
  }

  // Migrate elements
  const migratedElements = slide.elements.map(migrateSlideElement)

  return {
    ...slide,
    elements: migratedElements,
    useGlobalBackground,
    backgroundOverride:
      Object.keys(backgroundOverride || {}).length > 0 ? backgroundOverride : undefined
  }
}

// Song migration
export function migrateSong(song: Song): Song {
  const migratedSlides = song.slides.map((slide) => migrateSlide(slide, song.globalBackground))

  return {
    ...song,
    slides: migratedSlides
  }
}

// Presentation migration
export function migratePresentation(presentation: Presentation): Presentation {
  const migratedSlides = presentation.slides.map((slide) => ({
    ...migrateSlide(slide, presentation.background)
    // Presentation slides don't have type field, so we keep the structure
  }))

  return {
    ...presentation,
    slides: migratedSlides
  }
}

// Computed properties helpers
export function computeElementStyle(element: SlideElement): ElementStyle {
  if (!element.stylePreset) {
    return element.style
  }

  const preset = DEFAULT_STYLE_PRESETS.find((p) => p.id === element.stylePreset)
  if (!preset) {
    return element.style
  }

  return {
    ...preset.style,
    ...element.styleOverrides
  }
}

export function computeSlideBackground(
  slide: Slide,
  globalBackground?: Background
): Background | undefined {
  if (slide.useGlobalBackground) {
    if (!globalBackground) return undefined
    return {
      ...globalBackground,
      ...slide.backgroundOverride
    }
  }

  // Legacy mode - use existing background
  return slide.background
}

export function computeSongLyrics(song: Song): string {
  return song.slides.map((slide) => slide.content).join('\n\n')
}

// Validation functions
export function validateMigration(original: Song, migrated: Song): boolean {
  // Ensure lyrics are the same
  const originalLyrics = original.lyrics || computeSongLyrics(original)
  const migratedLyrics = computeSongLyrics(migrated)

  if (originalLyrics !== migratedLyrics) {
    console.error('Migration failed: lyrics mismatch')
    return false
  }

  // Ensure element styles are preserved
  for (let i = 0; i < original.slides.length; i++) {
    const originalSlide = original.slides[i]
    const migratedSlide = migrated.slides[i]

    for (let j = 0; j < originalSlide.elements.length; j++) {
      const originalElement = originalSlide.elements[j]
      const migratedElement = migratedSlide.elements[j]
      const computedStyle = computeElementStyle(migratedElement)

      if (!isStyleSimilar(originalElement.style, computedStyle, 1.0)) {
        console.error(`Migration failed: style mismatch at slide ${i}, element ${j}`)
        return false
      }
    }

    // Ensure backgrounds are preserved
    const originalBackground = originalSlide.background
    const computedBackground = computeSlideBackground(migratedSlide, migrated.globalBackground)

    if (!isBackgroundIdentical(originalBackground, computedBackground)) {
      console.error(`Migration failed: background mismatch at slide ${i}`)
      return false
    }
  }

  return true
}
