import { Link } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'

export default function Home(): JSX.Element {
  return (
    <div className="p-4 text-foreground">
      <h1 className="text-3xl font-bold">Welcome to Presenter</h1>
      <p className="mt-2 text-muted-foreground">Select a module from the sidebar to begin.</p>

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="flex gap-4">
          <Link to="/editor-v2?mode=song&action=create">
            <Button className="bg-blue-600 hover:bg-blue-700">🎵 New Song Editor (V2)</Button>
          </Link>
          <Link to="/canvas-editor">
            <Button variant="outline">🎨 Canvas Editor (Test)</Button>
          </Link>
          <Link to="/editor?mode=song&action=create">
            <Button variant="outline">📝 Legacy Editor</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
