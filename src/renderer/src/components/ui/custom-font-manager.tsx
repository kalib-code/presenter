import React, { useState, useEffect } from 'react'
import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './dialog'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { Trash2, Upload, Download, Eye } from 'lucide-react'
import { useToast } from '@renderer/hooks/use-toast'
import {
  uploadCustomFonts,
  getCustomFonts,
  deleteCustomFont,
  loadAllCustomFonts,
  formatFileSize,
  type CustomFont
} from '@renderer/utils/fontUtils'

interface CustomFontManagerProps {
  onFontSelected?: (fontName: string) => void
  trigger?: React.ReactNode
}

export const CustomFontManager: React.FC<CustomFontManagerProps> = ({
  onFontSelected,
  trigger
}) => {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // Load custom fonts on component mount
  useEffect(() => {
    loadCustomFonts()
  }, [])

  // Load custom fonts when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCustomFonts()
    }
  }, [isOpen])

  const loadCustomFonts = async () => {
    setIsLoading(true)
    try {
      const fonts = await getCustomFonts()
      setCustomFonts(fonts)

      // Load fonts into CSS
      await loadAllCustomFonts()
    } catch (error) {
      console.error('Failed to load custom fonts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load custom fonts',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async () => {
    setIsUploading(true)
    try {
      const result = await uploadCustomFonts()

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        })

        // Reload fonts list
        await loadCustomFonts()
      } else {
        toast({
          title: 'Upload Failed',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Font upload error:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload fonts',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (font: CustomFont) => {
    try {
      const result = await deleteCustomFont(font.id)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        })

        // Remove from local state
        setCustomFonts((prev) => prev.filter((f) => f.id !== font.id))
      } else {
        toast({
          title: 'Delete Failed',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Font delete error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete font',
        variant: 'destructive'
      })
    }
  }

  const handleFontSelect = (font: CustomFont) => {
    if (onFontSelected) {
      onFontSelected(font.name)
      setIsOpen(false)
    }
  }

  const formatUploadDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Manage Fonts
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Custom Font Manager
          </DialogTitle>
          <DialogDescription>
            Upload and manage your custom fonts. Supported formats: TTF, OTF, WOFF, WOFF2, EOT
          </DialogDescription>
        </DialogHeader>

        {/* Upload Section */}
        <div className="flex items-center justify-between py-4 border-b">
          <div>
            <h3 className="font-medium">Upload New Fonts</h3>
            <p className="text-sm text-muted-foreground">
              Select font files to upload (Max: 10MB per file)
            </p>
          </div>
          <Button onClick={handleUpload} disabled={isUploading} className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload Fonts'}
          </Button>
        </div>

        {/* Fonts List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading fonts...</p>
              </div>
            </div>
          ) : customFonts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Custom Fonts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your first custom font to get started
                </p>
                <Button onClick={handleUpload} disabled={isUploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Fonts
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 py-4">
              {customFonts.map((font, index) => (
                <Card key={`${font.id}-${index}`} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4
                            className="font-medium truncate text-lg"
                            style={{ fontFamily: font.name }}
                          >
                            {font.name}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        </div>

                        {/* Font Preview */}
                        <div
                          className="text-2xl mb-3 p-2 bg-muted/50 rounded border"
                          style={{ fontFamily: font.name }}
                        >
                          The quick brown fox jumps over the lazy dog
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>📁 {font.originalName}</span>
                          <span>📊 {formatFileSize(font.fileSize)}</span>
                          <span>📅 {formatUploadDate(font.uploadDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {onFontSelected && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFontSelect(font)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Use
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(font)}
                          className="text-destructive hover:text-destructive flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {customFonts.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {customFonts.length} custom font{customFonts.length !== 1 ? 's' : ''} installed
              </span>
              <span>
                Total size:{' '}
                {formatFileSize(customFonts.reduce((sum, font) => sum + font.fileSize, 0))}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
