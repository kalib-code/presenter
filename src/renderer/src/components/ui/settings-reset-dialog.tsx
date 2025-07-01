import React from 'react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface SettingsResetDialogProps {
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function SettingsResetDialog({ onConfirm, isLoading = false }: SettingsResetDialogProps): JSX.Element {
  const [open, setOpen] = React.useState(false)

  const handleConfirm = async () => {
    await onConfirm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reset Settings
          </DialogTitle>
          <DialogDescription className="text-left">
            This will reset all settings to their default values. This action cannot be undone.
            <br />
            <br />
            Are you sure you want to continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}