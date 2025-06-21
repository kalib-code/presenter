import { useRouteError } from 'react-router-dom'

export function ErrorBoundary(): JSX.Element {
  const error = useRouteError()

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Oops!</h1>
        <p className="text-lg text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'Something went wrong'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
