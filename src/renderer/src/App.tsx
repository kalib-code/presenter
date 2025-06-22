import Layout from '@renderer/components/Layout'
import { Toaster } from '@renderer/components/ui/toaster'
import Collection from '@renderer/pages/Collection'
import Editor from '@renderer/pages/Editor'
import EditorV2 from '@renderer/pages/EditorV2'
import Home from '@renderer/pages/Home'
import Presenter from '@renderer/pages/Presenter'
import Presentation from '@renderer/pages/Presentation'
import Setlist from '@renderer/pages/Setlist'
import SetlistPresenter from '@renderer/pages/SetlistPresenter'
import Settings from '@renderer/pages/Settings'
import { EditorCanvas } from '@renderer/components/editor/EditorCanvas'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { loadAllCustomFonts } from '@renderer/utils/fontUtils'
import { useSettingsStore } from '@renderer/store/settings'
import { usePersistenceStore } from '@renderer/store/editor-persistence'

function App(): JSX.Element {
  const isPresenter = window.location.hash.includes('presenter')
  const isPresentation = window.location.hash.includes('presentation')
  const initializeSettings = useSettingsStore((state) => state.initialize)
  const initializePersistence = usePersistenceStore((state) => state.initialize)

  // Initialize app on startup
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🚀 [APP] Starting app initialization...')
        
        // Initialize settings first
        console.log('🚀 [APP] Initializing settings...')
        await initializeSettings()
        console.log('✅ [APP] Settings initialized')
        
        // Initialize persistence store after settings are loaded
        console.log('🚀 [APP] Initializing persistence store...')
        initializePersistence()
        console.log('✅ [APP] Persistence store initialized')
        
        // Load custom fonts
        console.log('🚀 [APP] Loading custom fonts...')
        await loadAllCustomFonts()
        console.log('✅ [APP] Custom fonts loaded')
        
        console.log('✅ [APP] App initialization completed')
      } catch (error) {
        console.error('❌ [APP] App initialization failed:', error)
      }
    }

    initialize()
  }, [initializeSettings, initializePersistence])

  return (
    <HashRouter>
      <Routes>
        {isPresentation ? (
          <Route path="/presentation" element={<Presentation />} />
        ) : isPresenter ? (
          <>
            <Route path="/presenter" element={<Presenter />} />
            <Route path="/setlist-presenter" element={<SetlistPresenter />} />
          </>
        ) : (
          <>
            <Route path="/editor" element={<Editor />} />
            <Route path="/editor-v2" element={<EditorV2 />} />
            <Route path="/canvas-editor" element={<EditorCanvas className="h-screen" />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="settings" element={<Settings />} />
              <Route path="collection" element={<Collection />} />
              <Route path="setlist" element={<Setlist />} />
            </Route>
          </>
        )}
      </Routes>
      <Toaster />
    </HashRouter>
  )
}

export default App
