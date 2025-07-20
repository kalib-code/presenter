/**
 * PreviewMediaElement Component
 * 
 * A component for rendering media elements (images and videos) in preview mode
 * with URL resolution capabilities.
 */

import React, { useState, useEffect } from 'react'
import { resolveMediaUrl, isMediaReference } from '@renderer/utils/mediaUtils'

/**
 * Props for PreviewMediaElement component
 */
export interface PreviewMediaElementProps {
  /** The media element to render */
  element: {
    id: string
    type: 'text' | 'image' | 'video'
    content: string
    style: {
      opacity?: number
    }
  }
  /** Scaled left position in pixels */
  scaledLeft: number
  /** Scaled top position in pixels */
  scaledTop: number
  /** Scaled width in pixels */
  scaledWidth: number
  /** Scaled height in pixels */
  scaledHeight: number
}

/**
 * PreviewMediaElement component for rendering images and videos in preview mode
 * 
 * Handles URL resolution for media references and provides error handling
 * for failed media loads.
 * 
 * @param props - Component props
 * @returns JSX element or null if not a supported media type
 */
export const PreviewMediaElement: React.FC<PreviewMediaElementProps> = ({
  element,
  scaledLeft,
  scaledTop,
  scaledWidth,
  scaledHeight
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>(element.content)

  // Resolve media URL if it's a media reference
  useEffect(() => {
    const loadUrl = async (): Promise<void> => {
      if (isMediaReference(element.content)) {
        try {
          const resolved = await resolveMediaUrl(element.content)
          setResolvedUrl(resolved)
          console.log(
            '🔍 [PREVIEW] Resolved media URL:',
            element.content,
            '→',
            resolved.substring(0, 50) + '...'
          )
        } catch (error) {
          console.error('❌ [PREVIEW] Failed to resolve media URL:', element.content, error)
          setResolvedUrl(element.content) // Fallback to original
        }
      } else {
        setResolvedUrl(element.content)
      }
    }

    loadUrl()
  }, [element.content])

  // Common styling for positioned elements
  const commonStyles = {
    left: `${scaledLeft}px`,
    top: `${scaledTop}px`,
    width: `${scaledWidth}px`,
    height: `${scaledHeight}px`,
    opacity: element.style.opacity || 1
  }

  // Render image element
  if (element.type === 'image') {
    return (
      <img
        src={resolvedUrl}
        alt="Slide element"
        className="absolute object-cover"
        style={commonStyles}
        onError={() => {
          console.error('🖼️ [PREVIEW] Image failed to load:', element.content, resolvedUrl)
        }}
      />
    )
  }

  // Render video element
  if (element.type === 'video') {
    return (
      <video
        src={resolvedUrl}
        className="absolute object-cover"
        style={commonStyles}
        muted
        loop
        autoPlay
        playsInline
        onError={() => {
          console.error('🎬 [PREVIEW] Video failed to load:', element.content, resolvedUrl)
        }}
      />
    )
  }

  return null
}

export default PreviewMediaElement