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

function App(): JSX.Element {
  const isPresenter = window.location.hash.includes('presenter')
  const isPresentation = window.location.hash.includes('presentation')

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
