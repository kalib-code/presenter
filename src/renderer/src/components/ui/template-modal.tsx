import React, { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog'
import {
  defaultTemplates,
  applyTemplateVariables,
  type SetlistTemplate
} from '@renderer/lib/setlist-templates'
import { Music, Calendar, Clock, Users } from 'lucide-react'

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateFromTemplate: (template: SetlistTemplate, variables: Record<string, string>) => void
}

export function TemplateModal({ isOpen, onClose, onCreateFromTemplate }: TemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SetlistTemplate | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'select' | 'customize'>('select')

  const handleSelectTemplate = (template: SetlistTemplate) => {
    setSelectedTemplate(template)

    // Initialize variables with default values
    const initialVariables: Record<string, string> = {}
    template.variables?.forEach((variable) => {
      initialVariables[variable.key] = variable.defaultValue
    })
    setVariables(initialVariables)

    if (template.variables && template.variables.length > 0) {
      setStep('customize')
    } else {
      // No variables to customize, create immediately
      onCreateFromTemplate(template, {})
      handleClose()
    }
  }

  const handleCreate = () => {
    if (selectedTemplate) {
      const processedTemplate = applyTemplateVariables(selectedTemplate, variables)
      onCreateFromTemplate(processedTemplate, variables)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    setVariables({})
    setStep('select')
    onClose()
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'service':
        return <Music className="w-4 h-4" />
      case 'event':
        return <Calendar className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'service':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'event':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Choose a Setlist Template' : 'Customize Template'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {defaultTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <h3 className="font-semibold">{template.name}</h3>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}
                    >
                      {template.category}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{template.items.length} items</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(template.estimatedDuration)}</span>
                      </div>
                    </div>
                  </div>

                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : selectedTemplate ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">{selectedTemplate.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
            </div>

            {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Customize Template Variables</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable.key} className="space-y-2">
                      <Label htmlFor={variable.key}>{variable.label}</Label>
                      <Input
                        id={variable.key}
                        type={variable.type === 'number' ? 'number' : 'text'}
                        value={variables[variable.key] || ''}
                        onChange={(e) =>
                          setVariables((prev) => ({
                            ...prev,
                            [variable.key]: e.target.value
                          }))
                        }
                        placeholder={variable.defaultValue}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Template Preview</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {selectedTemplate.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-center text-muted-foreground">{index + 1}</span>
                    <span className="font-medium">
                      {applyTemplateVariables(selectedTemplate, variables).items[index].title}
                    </span>
                    <span className="text-muted-foreground">
                      ({formatDuration(item.duration || 0)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {step === 'customize' && (
            <Button variant="outline" onClick={() => setStep('select')}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'customize' && <Button onClick={handleCreate}>Create Setlist</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
