import React, { useState, useCallback } from 'react'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { TagsInput } from '@renderer/components/ui/tags-input'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@renderer/components/ui/collapsible'
import { DateTimePicker } from '@renderer/components/ui/date-time-picker'
import { 
  Presentation, 
  User, 
  Calendar, 
  Clock, 
  Hash,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  MapPin,
  Target,
  BookOpen,
  Megaphone,
  Star,
  Settings
} from 'lucide-react'

interface PresentationMetadataProps {
  // Basic Information
  title: string
  onTitleChange: (value: string) => void
  speaker?: string
  onSpeakerChange?: (value: string) => void
  type: 'scripture' | 'announcement' | 'custom' | 'sermon' | 'teaching' | 'testimony' | 'prayer'
  onTypeChange: (value: string) => void
  
  // Event Context
  serviceDate?: Date
  onServiceDateChange?: (value: Date | undefined) => void
  occasion?: string
  onOccasionChange?: (value: string) => void
  location?: string
  onLocationChange?: (value: string) => void
  
  // Content Information
  description?: string
  onDescriptionChange?: (value: string) => void
  scripture?: string
  onScriptureChange?: (value: string) => void
  topic?: string
  onTopicChange?: (value: string) => void
  
  // Duration and Timing
  estimatedDuration?: number
  onEstimatedDurationChange?: (value: number | undefined) => void
  
  // Additional Metadata
  tags: string[]
  onTagsChange: (tags: string[]) => void
  audience?: string
  onAudienceChange?: (value: string) => void
  language?: string
  onLanguageChange?: (value: string) => void
  
  // Preparation Notes
  notes?: string
  onNotesChange?: (value: string) => void
  
  className?: string
}

export const PresentationMetadata: React.FC<PresentationMetadataProps> = ({
  title,
  onTitleChange,
  speaker,
  onSpeakerChange,
  type,
  onTypeChange,
  serviceDate,
  onServiceDateChange,
  occasion,
  onOccasionChange,
  location,
  onLocationChange,
  description,
  onDescriptionChange,
  scripture,
  onScriptureChange,
  topic,
  onTopicChange,
  estimatedDuration,
  onEstimatedDurationChange,
  tags,
  onTagsChange,
  audience,
  onAudienceChange,
  language,
  onLanguageChange,
  notes,
  onNotesChange,
  className = ''
}) => {
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [showContentDetails, setShowContentDetails] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Presentation types with icons and descriptions
  const presentationTypes = [
    { value: 'scripture', label: 'Scripture Reading', icon: BookOpen, description: 'Biblical text presentation' },
    { value: 'sermon', label: 'Sermon', icon: User, description: 'Main teaching message' },
    { value: 'teaching', label: 'Teaching', icon: Target, description: 'Educational content' },
    { value: 'announcement', label: 'Announcement', icon: Megaphone, description: 'Church announcements' },
    { value: 'testimony', label: 'Testimony', icon: Star, description: 'Personal testimony' },
    { value: 'prayer', label: 'Prayer', icon: Users, description: 'Prayer or liturgy' },
    { value: 'custom', label: 'Custom', icon: Settings, description: 'Other presentation type' }
  ]

  // Common occasions
  const commonOccasions = [
    'Sunday Service', 'Wednesday Service', 'Prayer Meeting', 'Bible Study',
    'Easter Service', 'Christmas Service', 'Baptism', 'Communion',
    'Youth Service', 'Children\'s Service', 'Special Event', 'Conference',
    'Wedding', 'Funeral', 'Dedication', 'Other'
  ]

  // Audience types
  const audienceTypes = [
    'General Congregation', 'Youth', 'Children', 'Adults Only',
    'Seniors', 'Small Group', 'Leadership', 'Visitors',
    'New Members', 'Mixed Age', 'Other'
  ]

  // Languages
  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Chinese', 'Japanese', 'Korean', 'Other'
  ]

  const formatDuration = useCallback((minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }, [])

  const getTypeInfo = (typeValue: string) => {
    return presentationTypes.find(t => t.value === typeValue) || presentationTypes[presentationTypes.length - 1]
  }

  const currentType = getTypeInfo(type)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Presentation className="w-5 h-5" />
            Presentation Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="presentation-title" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Title *
            </Label>
            <Input
              id="presentation-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter presentation title"
              className="font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="presentation-type">Type *</Label>
              <Select value={type} onValueChange={onTypeChange}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <currentType.icon className="w-4 h-4" />
                      {currentType.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {presentationTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="presentation-speaker" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Speaker / Presenter
              </Label>
              <Input
                id="presentation-speaker"
                value={speaker || ''}
                onChange={(e) => onSpeakerChange?.(e.target.value)}
                placeholder="Enter speaker name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Tags
            </Label>
            <TagsInput
              tags={tags}
              onTagsChange={onTagsChange}
              placeholder="Add tags (press Enter to add)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Context */}
      <Collapsible open={showEventDetails} onOpenChange={setShowEventDetails}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Event Context
            </span>
            {showEventDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Service Date & Time
                  </Label>
                  <DateTimePicker
                    date={serviceDate}
                    onDateChange={onServiceDateChange}
                    placeholder="Select date and time"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="presentation-occasion">Occasion</Label>
                  <Select value={occasion || ''} onValueChange={(value) => onOccasionChange?.(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonOccasions.map((occ) => (
                        <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="presentation-location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="presentation-location"
                    value={location || ''}
                    onChange={(e) => onLocationChange?.(e.target.value)}
                    placeholder="Main sanctuary, Fellowship hall, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated-duration" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Estimated Duration
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="estimated-duration"
                      type="number"
                      value={estimatedDuration || ''}
                      onChange={(e) => onEstimatedDurationChange?.(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="30"
                      min="1"
                      max="300"
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                    {estimatedDuration && (
                      <Badge variant="secondary">{formatDuration(estimatedDuration)}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Content Details */}
      <Collapsible open={showContentDetails} onOpenChange={setShowContentDetails}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Content Details
            </span>
            {showContentDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="presentation-description">Description / Summary</Label>
                <Textarea
                  id="presentation-description"
                  value={description || ''}
                  onChange={(e) => onDescriptionChange?.(e.target.value)}
                  placeholder="Brief description of the presentation content and main points..."
                  className="min-h-[80px] resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="presentation-scripture">Scripture Reference</Label>
                  <Input
                    id="presentation-scripture"
                    value={scripture || ''}
                    onChange={(e) => onScriptureChange?.(e.target.value)}
                    placeholder="e.g., John 3:16, Romans 8:28-30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="presentation-topic">Main Topic / Theme</Label>
                  <Input
                    id="presentation-topic"
                    value={topic || ''}
                    onChange={(e) => onTopicChange?.(e.target.value)}
                    placeholder="Love, Grace, Faith, etc."
                  />
                </div>
              </div>

              {(scripture || topic) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {scripture && <Badge variant="outline">📖 {scripture}</Badge>}
                  {topic && <Badge variant="outline">🎯 {topic}</Badge>}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Advanced Settings */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced Settings
            </span>
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="presentation-audience" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Target Audience
                  </Label>
                  <Select value={audience || ''} onValueChange={(value) => onAudienceChange?.(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceTypes.map((aud) => (
                        <SelectItem key={aud} value={aud}>{aud}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentation-language">Language</Label>
                  <Select value={language || ''} onValueChange={(value) => onLanguageChange?.(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Preparation Notes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            Preparation Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="presentation-notes">Notes & Instructions</Label>
            <Textarea
              id="presentation-notes"
              value={notes || ''}
              onChange={(e) => onNotesChange?.(e.target.value)}
              placeholder="Add preparation notes, technical requirements, special instructions, or other important details..."
              className="min-h-[100px] resize-y"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}