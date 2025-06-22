import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Badge } from '@renderer/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { useTemplateStore, SlideTemplate } from '@renderer/store/editor-templates'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { useSlidesStore } from '@renderer/store/editor-slides'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Search, FileText, Music, Megaphone, Presentation, Plus, Trash2 } from 'lucide-react'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const {
    templates,
    applyTemplate,
    deleteTemplate,
    duplicateTemplate,
    createTemplateFromCurrentSlide
  } = useTemplateStore()

  const { setElements } = useCanvasStore()
  const { updateSlide, currentSlideIndex } = useSlidesStore()

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let filtered = templates

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((template) => template.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm) ||
          template.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
      )
    }

    return filtered
  }, [templates, selectedCategory, searchQuery])

  const handleApplyTemplate = (template: SlideTemplate) => {
    const elements = applyTemplate(template.id)
    if (elements.length > 0) {
      setElements(elements)
      
      // Update the current slide with the new elements
      // Convert EditorElement back to SlideElement for slide storage
      const slideElements = elements.map(element => ({
        id: element.id,
        type: element.type,
        position: element.position,
        size: element.size,
        content: element.content,
        style: {
          fontFamily: element.style.fontFamily,
          fontSize: element.style.fontSize,
          fontWeight: element.style.fontWeight,
          fontStyle: element.style.fontStyle,
          textAlign: element.style.textAlign,
          color: element.style.color,
          backgroundColor: element.style.backgroundColor,
          opacity: element.opacity,
          lineHeight: element.style.lineHeight,
          textShadow: element.style.textShadow
        },
        zIndex: element.zIndex || 0
      }))
      
      updateSlide(currentSlideIndex, {
        elements: slideElements,
        title: template.name.includes('Title') ? 'New ' + template.name : undefined
      })
      
      onClose()
    }
  }

  const handleDeleteTemplate = (template: SlideTemplate) => {
    if (template.isBuiltIn) {
      return // Can't delete built-in templates
    }

    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplate(template.id)
    }
  }

  const handleDuplicateTemplate = (template: SlideTemplate) => {
    duplicateTemplate(template.id)
  }

  const handleCreateFromCurrentSlide = () => {
    const templateName = prompt('Enter template name:')
    if (!templateName) return

    const templateDescription = prompt('Enter template description:') || ''
    createTemplateFromCurrentSlide(templateName, templateDescription, 'custom')
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'worship':
        return <Music className="w-4 h-4" />
      case 'announcement':
        return <Megaphone className="w-4 h-4" />
      case 'presentation':
        return <Presentation className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'worship':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'announcement':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'presentation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'custom':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose a Slide Template</DialogTitle>
          <DialogDescription>
            Select a pre-designed template to quickly create your slide, or create a new template from your current slide.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search and Create Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleCreateFromCurrentSlide}
              variant="outline"
              className="whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              Save as Template
            </Button>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="worship">Worship</TabsTrigger>
              <TabsTrigger value="announcement">Announcements</TabsTrigger>
              <TabsTrigger value="presentation">Presentations</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              {/* Templates Grid */}
              <div className="max-h-96 overflow-y-auto">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No templates found matching your search.' : 'No templates in this category.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow group"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {getCategoryIcon(template.category)}
                              <CardTitle className="text-sm font-medium truncate">
                                {template.name}
                              </CardTitle>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!template.isBuiltIn && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDuplicateTemplate(template)
                                    }}
                                  >
                                    📋
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteTemplate(template)
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-xs mb-3 line-clamp-2">
                            {template.description}
                          </CardDescription>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getCategoryColor(template.category)}`}
                            >
                              {template.category}
                            </Badge>
                            {template.isBuiltIn && (
                              <Badge variant="outline" className="text-xs">
                                Built-in
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {template.elements.length} element{template.elements.length !== 1 ? 's' : ''}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}