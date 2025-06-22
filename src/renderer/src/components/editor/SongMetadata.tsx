import React, { useState, useCallback } from 'react'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { TagsInput } from '@renderer/components/ui/tags-input'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@renderer/components/ui/collapsible'
import { 
  Music, 
  User, 
  Calendar, 
  Clock, 
  Hash,
  ChevronDown,
  ChevronRight,
  Copyright,
  Users,
  Disc3,
  Timer,
  Volume2
} from 'lucide-react'

interface SongMetadataProps {
  // Basic Information
  title: string
  onTitleChange: (value: string) => void
  artist: string
  onArtistChange: (value: string) => void
  
  // Extended Song Information
  album?: string
  onAlbumChange?: (value: string) => void
  year?: number
  onYearChange?: (value: number | undefined) => void
  genre?: string
  onGenreChange?: (value: string) => void
  
  // Musical Information
  tempo?: number
  onTempoChange?: (value: number | undefined) => void
  key?: string
  onKeyChange?: (value: string) => void
  duration?: number
  onDurationChange?: (value: number | undefined) => void
  
  // Additional Metadata
  tags: string[]
  onTagsChange: (tags: string[]) => void
  copyright?: string
  onCopyrightChange?: (value: string) => void
  publisher?: string
  onPublisherChange?: (value: string) => void
  language?: string
  onLanguageChange?: (value: string) => void
  
  // Performance Notes
  notes?: string
  onNotesChange?: (value: string) => void
  
  className?: string
}

export const SongMetadata: React.FC<SongMetadataProps> = ({
  title,
  onTitleChange,
  artist,
  onArtistChange,
  album,
  onAlbumChange,
  year,
  onYearChange,
  genre,
  onGenreChange,
  tempo,
  onTempoChange,
  key,
  onKeyChange,
  duration,
  onDurationChange,
  tags,
  onTagsChange,
  copyright,
  onCopyrightChange,
  publisher,
  onPublisherChange,
  language,
  onLanguageChange,
  notes,
  onNotesChange,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMusical, setShowMusical] = useState(false)
  const [showCopyright, setShowCopyright] = useState(false)

  // Common music genres for quick selection
  const commonGenres = [
    'Contemporary Christian', 'Worship', 'Gospel', 'Hymn', 'Praise',
    'Rock', 'Pop', 'Country', 'Folk', 'Jazz', 'Blues', 'Classical'
  ]

  // Common music keys
  const musicKeys = [
    'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
    'Am', 'A#m', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'
  ]

  // Common languages
  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Chinese', 'Japanese', 'Korean', 'Other'
  ]

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const parseDuration = useCallback((timeStr: string): number | undefined => {
    const match = timeStr.match(/^(\d+):([0-5]\d)$/)
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2])
    }
    return undefined
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5" />
            Song Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="song-title" className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Song Title *
              </Label>
              <Input
                id="song-title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter song title"
                className="font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="song-artist" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Artist / Performer *
              </Label>
              <Input
                id="song-artist"
                value={artist}
                onChange={(e) => onArtistChange(e.target.value)}
                placeholder="Enter artist name"
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

      {/* Advanced Information */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Disc3 className="w-4 h-4" />
              Album & Publication Details
            </span>
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="song-album">Album</Label>
                  <Input
                    id="song-album"
                    value={album || ''}
                    onChange={(e) => onAlbumChange?.(e.target.value)}
                    placeholder="Album name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="song-year" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Release Year
                  </Label>
                  <Input
                    id="song-year"
                    type="number"
                    value={year || ''}
                    onChange={(e) => onYearChange?.(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="YYYY"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="song-genre">Genre</Label>
                  <Select value={genre || ''} onValueChange={(value) => onGenreChange?.(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonGenres.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                      <SelectItem value="custom">Other...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="song-language">Language</Label>
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

      {/* Musical Information */}
      <Collapsible open={showMusical} onOpenChange={setShowMusical}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Musical Details
            </span>
            {showMusical ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="song-tempo" className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Tempo (BPM)
                  </Label>
                  <Input
                    id="song-tempo"
                    type="number"
                    value={tempo || ''}
                    onChange={(e) => onTempoChange?.(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="120"
                    min="40"
                    max="200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="song-key">Key</Label>
                  <Select value={key || ''} onValueChange={(value) => onKeyChange?.(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                      {musicKeys.map((k) => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="song-duration" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration
                  </Label>
                  <Input
                    id="song-duration"
                    value={duration ? formatDuration(duration) : ''}
                    onChange={(e) => {
                      const parsed = parseDuration(e.target.value)
                      onDurationChange?.(parsed)
                    }}
                    placeholder="3:45"
                    pattern="[0-9]+:[0-5][0-9]"
                  />
                </div>
              </div>

              {(tempo || key || duration) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tempo && <Badge variant="secondary">♩ = {tempo} BPM</Badge>}
                  {key && <Badge variant="secondary">Key: {key}</Badge>}
                  {duration && <Badge variant="secondary">{formatDuration(duration)}</Badge>}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Copyright Information */}
      <Collapsible open={showCopyright} onOpenChange={setShowCopyright}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Copyright className="w-4 h-4" />
              Copyright & Licensing
            </span>
            {showCopyright ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="song-copyright">Copyright Information</Label>
                <Input
                  id="song-copyright"
                  value={copyright || ''}
                  onChange={(e) => onCopyrightChange?.(e.target.value)}
                  placeholder="© 2024 Example Music Publishing"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="song-publisher">Publisher</Label>
                <Input
                  id="song-publisher"
                  value={publisher || ''}
                  onChange={(e) => onPublisherChange?.(e.target.value)}
                  placeholder="Music publisher or label"
                />
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Performance Notes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Performance Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="song-notes">Notes & Instructions</Label>
            <Textarea
              id="song-notes"
              value={notes || ''}
              onChange={(e) => onNotesChange?.(e.target.value)}
              placeholder="Add performance notes, chord progressions, arrangement details, or other instructions..."
              className="min-h-[100px] resize-y"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}