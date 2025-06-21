import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { toast } from './ui/toast'

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [checking, setChecking] = useState(false)

  const checkForUpdates = async () => {
    try {
      setChecking(true)
      const result = await window.electron.checkForUpdates()

      if (result?.updateInfo) {
        setUpdateAvailable(true)
        toast({
          title: 'Update Available',
          description: `Version ${result.updateInfo.version} is ready to download.`,
          duration: 5000
        })
      } else {
        toast({
          title: 'No Updates',
          description: "You're running the latest version.",
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      toast({
        title: 'Update Check Failed',
        description: 'Could not check for updates. Please try again later.',
        variant: 'destructive',
        duration: 3000
      })
    } finally {
      setChecking(false)
    }
  }

  const installUpdate = async () => {
    try {
      await window.electron.quitAndInstall()
    } catch (error) {
      console.error('Error installing update:', error)
      toast({
        title: 'Installation Failed',
        description: 'Could not install update. Please try again.',
        variant: 'destructive',
        duration: 3000
      })
    }
  }

  useEffect(() => {
    // Check for updates on component mount
    checkForUpdates()
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={checkForUpdates} disabled={checking}>
        {checking ? 'Checking...' : 'Check for Updates'}
      </Button>

      {updateAvailable && (
        <Button size="sm" onClick={installUpdate} className="bg-green-600 hover:bg-green-700">
          Install Update
        </Button>
      )}
    </div>
  )
}
