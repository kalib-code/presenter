import { useBackgroundStore } from '@renderer/store/editor-background'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { useEditorMetaStore } from '@renderer/store/editor-meta'
import { useHistoryStore } from '@renderer/store/editor-history'
import { useSlidesStore } from '@renderer/store/editor-slides'
import { usePersistenceStore } from '@renderer/store/editor-persistence'

/**
 * Utility functions for testing store clearing and preventing data leaks
 */

// Initial state snapshots for comparison
const getInitialBackgroundState = () => ({
  backgroundType: 'none',
  backgroundImage: null,
  backgroundVideo: null,
  backgroundVideoBlob: null,
  backgroundOpacity: 1,
  videoPlaybackRate: 1,
  videoLoop: true,
  videoMuted: true,
  globalBackgroundType: 'none',
  globalBackgroundImage: null,
  globalBackgroundVideo: null,
  globalBackgroundVideoBlob: null,
  globalBackgroundOpacity: 1,
  globalVideoPlaybackRate: 1,
  globalVideoLoop: true,
  globalVideoMuted: true,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  isBackgroundPanelOpen: false
})

const getInitialCanvasState = () => ({
  elements: [],
  selectedElementId: null,
  isDragging: false,
  draggedElementId: null,
  dragOffset: { x: 0, y: 0 },
  isResizing: false,
  resizeHandle: null,
  canvasSize: { width: 960, height: 540 },
  safeArea: { top: 40, right: 60, bottom: 40, left: 60 }
})

const getInitialMetaState = () => ({
  mode: 'song',
  action: 'create',
  itemId: undefined,
  title: '',
  artist: '',
  tags: [],
  isLoading: false,
  isSaving: false,
  lastSaved: undefined,
  hasUnsavedChanges: false
})

const getInitialHistoryState = () => ({
  actions: [],
  currentIndex: -1,
  maxHistorySize: 50,
  isUndoing: false,
  isRedoing: false
})

/**
 * Clears all editor stores to prevent data leaks
 */
export const clearAllEditorStores = (): void => {
  console.log('🧹 [STORE_TEST] Clearing all editor stores...')

  // Clear canvas store
  useCanvasStore.getState().initialize([])

  // Clear background store (with cleanup)
  useBackgroundStore.getState().reset()

  // Clear slides store
  useSlidesStore.getState().reset()

  // Clear history
  useHistoryStore.getState().clear()

  // Reset meta store
  useEditorMetaStore.getState().reset()

  // Cleanup persistence subscriptions
  usePersistenceStore.getState().cleanup()

  console.log('✅ [STORE_TEST] All editor stores cleared')
}

/**
 * Validates that all stores are in their initial state
 */
export const validateStoresCleared = (): boolean => {
  console.log('🔍 [STORE_TEST] Validating stores are cleared...')

  const backgroundState = useBackgroundStore.getState()
  const canvasState = useCanvasStore.getState()
  const metaState = useEditorMetaStore.getState()
  const historyState = useHistoryStore.getState()
  const slidesState = useSlidesStore.getState()

  // Check background store
  const expectedBackground = getInitialBackgroundState()
  const backgroundValid = Object.keys(expectedBackground).every((key) => {
    const expected = expectedBackground[key as keyof typeof expectedBackground]
    const actual = backgroundState[key as keyof typeof backgroundState]
    const isEqual = JSON.stringify(expected) === JSON.stringify(actual)
    if (!isEqual) {
      console.error(`❌ [STORE_TEST] Background store ${key} not cleared:`, { expected, actual })
    }
    return isEqual
  })

  // Check canvas store (excluding canvas size and safe area which are constants)
  const canvasValid =
    canvasState.elements.length === 0 &&
    canvasState.selectedElementId === null &&
    canvasState.isDragging === false &&
    canvasState.draggedElementId === null &&
    canvasState.isResizing === false &&
    canvasState.resizeHandle === null

  if (!canvasValid) {
    console.error('❌ [STORE_TEST] Canvas store not properly cleared:', {
      elementsCount: canvasState.elements.length,
      selectedElementId: canvasState.selectedElementId,
      isDragging: canvasState.isDragging,
      draggedElementId: canvasState.draggedElementId,
      isResizing: canvasState.isResizing,
      resizeHandle: canvasState.resizeHandle
    })
  }

  // Check meta store (excluding mode which might be set during initialization)
  const metaValid =
    metaState.action === 'create' &&
    metaState.itemId === undefined &&
    metaState.title === '' &&
    metaState.artist === '' &&
    metaState.tags.length === 0 &&
    metaState.isLoading === false &&
    metaState.isSaving === false &&
    metaState.hasUnsavedChanges === false

  if (!metaValid) {
    console.error('❌ [STORE_TEST] Meta store not properly cleared:', {
      action: metaState.action,
      itemId: metaState.itemId,
      title: metaState.title,
      artist: metaState.artist,
      tagsCount: metaState.tags.length,
      isLoading: metaState.isLoading,
      isSaving: metaState.isSaving,
      hasUnsavedChanges: metaState.hasUnsavedChanges
    })
  }

  // Check history store
  const historyValid =
    historyState.actions.length === 0 &&
    historyState.currentIndex === -1 &&
    historyState.isUndoing === false &&
    historyState.isRedoing === false

  if (!historyValid) {
    console.error('❌ [STORE_TEST] History store not properly cleared:', {
      actionsCount: historyState.actions.length,
      currentIndex: historyState.currentIndex,
      isUndoing: historyState.isUndoing,
      isRedoing: historyState.isRedoing
    })
  }

  // Check slides store - should have at least one initial slide
  const slidesValid =
    slidesState.slides.length >= 1 &&
    slidesState.currentSlideIndex === 0 &&
    slidesState.editingSlideTitle === null &&
    slidesState.tempSlideTitle === ''

  if (!slidesValid) {
    console.error('❌ [STORE_TEST] Slides store not properly initialized:', {
      slidesCount: slidesState.slides.length,
      currentSlideIndex: slidesState.currentSlideIndex,
      editingSlideTitle: slidesState.editingSlideTitle,
      tempSlideTitle: slidesState.tempSlideTitle
    })
  }

  const allValid = backgroundValid && canvasValid && metaValid && historyValid && slidesValid

  if (allValid) {
    console.log('✅ [STORE_TEST] All stores properly cleared/initialized')
  } else {
    console.log('❌ [STORE_TEST] Some stores not properly cleared')
  }

  return allValid
}

/**
 * Simulates creating content in the editor to test for data leaks
 */
export const simulateEditorUsage = (): void => {
  console.log('🎭 [STORE_TEST] Simulating editor usage...')

  const metaStore = useEditorMetaStore.getState()
  const slidesStore = useSlidesStore.getState()
  const canvasStore = useCanvasStore.getState()
  const backgroundStore = useBackgroundStore.getState()

  // Simulate editing meta information
  metaStore.setTitle('Test Song Title')
  metaStore.setArtist('Test Artist')
  metaStore.addTag('test-tag')

  // Simulate adding slides
  slidesStore.addSlide()
  slidesStore.updateSlideTitle(0, 'Verse 1')
  slidesStore.updateSlideContent(0, 'Test verse content')

  // Simulate adding canvas elements
  canvasStore.addElement('text', {
    content: 'Test text element',
    position: { x: 100, y: 100 },
    size: { width: 200, height: 50 }
  })

  // Simulate setting backgrounds
  backgroundStore.setSlideBackground('image', 'test-image-url')
  backgroundStore.setGlobalBackground('video', 'test-video-url')

  console.log('✅ [STORE_TEST] Editor usage simulated')
}

/**
 * Comprehensive test for store clearing functionality
 */
export const testStoreClearingFunctionality = (): boolean => {
  console.log('🧪 [STORE_TEST] Starting comprehensive store clearing test...')

  // Step 1: Clear all stores to start with clean slate
  clearAllEditorStores()

  // Step 2: Validate initial state
  if (!validateStoresCleared()) {
    console.error('❌ [STORE_TEST] Initial clearing failed')
    return false
  }

  // Step 3: Simulate usage
  simulateEditorUsage()

  // Step 4: Verify stores have data
  const metaState = useEditorMetaStore.getState()
  const hasData =
    metaState.title !== '' ||
    metaState.artist !== '' ||
    metaState.tags.length > 0 ||
    useCanvasStore.getState().elements.length > 0 ||
    useBackgroundStore.getState().backgroundType !== 'none'

  if (!hasData) {
    console.error('❌ [STORE_TEST] Failed to simulate data in stores')
    return false
  }

  console.log('✅ [STORE_TEST] Data successfully added to stores')

  // Step 5: Clear stores again
  clearAllEditorStores()

  // Step 6: Validate clearing worked
  if (!validateStoresCleared()) {
    console.error('❌ [STORE_TEST] Final clearing failed - DATA LEAK DETECTED!')
    return false
  }

  console.log('🎉 [STORE_TEST] Store clearing test PASSED - No data leaks detected!')
  return true
}
