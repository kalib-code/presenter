import React from 'react'
import { useEditorMetaStore, type PresentationType } from '@renderer/store/editor-meta'
import { SongMetadata } from './SongMetadata'
import { PresentationMetadata } from './PresentationMetadata'

interface MetadataPanelProps {
  className?: string
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ className = '' }) => {
  const {
    mode,
    title,
    setTitle,
    artist,
    setArtist,
    tags,
    setTags,
    songMetadata,
    presentationMetadata,
    updateSongMetadata,
    updatePresentationMetadata
  } = useEditorMetaStore()

  if (mode === 'song') {
    return (
      <SongMetadata
        title={title}
        onTitleChange={setTitle}
        artist={artist}
        onArtistChange={setArtist}
        tags={tags}
        onTagsChange={setTags}
        className={className}
        // Extended song fields
        album={songMetadata.album}
        onAlbumChange={(value) => updateSongMetadata({ album: value })}
        year={songMetadata.year}
        onYearChange={(value) => updateSongMetadata({ year: value })}
        genre={songMetadata.genre}
        onGenreChange={(value) => updateSongMetadata({ genre: value })}
        tempo={songMetadata.tempo}
        onTempoChange={(value) => updateSongMetadata({ tempo: value })}
        key={songMetadata.key}
        onKeyChange={(value) => updateSongMetadata({ key: value })}
        duration={songMetadata.duration}
        onDurationChange={(value) => updateSongMetadata({ duration: value })}
        copyright={songMetadata.copyright}
        onCopyrightChange={(value) => updateSongMetadata({ copyright: value })}
        publisher={songMetadata.publisher}
        onPublisherChange={(value) => updateSongMetadata({ publisher: value })}
        language={songMetadata.language}
        onLanguageChange={(value) => updateSongMetadata({ language: value })}
        notes={songMetadata.notes}
        onNotesChange={(value) => updateSongMetadata({ notes: value })}
      />
    )
  }

  // For presentation mode
  return (
    <PresentationMetadata
      title={title}
      onTitleChange={setTitle}
      speaker={presentationMetadata.speaker || artist} // Use presentation speaker or fallback to artist
      onSpeakerChange={(value) => {
        updatePresentationMetadata({ speaker: value })
        setArtist(value) // Keep artist field in sync for compatibility
      }}
      type={presentationMetadata.type}
      onTypeChange={(value) => updatePresentationMetadata({ type: value as PresentationType })}
      tags={tags}
      onTagsChange={setTags}
      className={className}
      // Extended presentation fields
      serviceDate={presentationMetadata.serviceDate}
      onServiceDateChange={(value) => updatePresentationMetadata({ serviceDate: value })}
      occasion={presentationMetadata.occasion}
      onOccasionChange={(value) => updatePresentationMetadata({ occasion: value })}
      location={presentationMetadata.location}
      onLocationChange={(value) => updatePresentationMetadata({ location: value })}
      description={presentationMetadata.description}
      onDescriptionChange={(value) => updatePresentationMetadata({ description: value })}
      scripture={presentationMetadata.scripture}
      onScriptureChange={(value) => updatePresentationMetadata({ scripture: value })}
      topic={presentationMetadata.topic}
      onTopicChange={(value) => updatePresentationMetadata({ topic: value })}
      estimatedDuration={presentationMetadata.estimatedDuration}
      onEstimatedDurationChange={(value) =>
        updatePresentationMetadata({ estimatedDuration: value })
      }
      audience={presentationMetadata.audience}
      onAudienceChange={(value) => updatePresentationMetadata({ audience: value })}
      language={presentationMetadata.language}
      onLanguageChange={(value) => updatePresentationMetadata({ language: value })}
      notes={presentationMetadata.notes}
      onNotesChange={(value) => updatePresentationMetadata({ notes: value })}
    />
  )
}
