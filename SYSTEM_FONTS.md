# System Font Implementation

## Overview

This document outlines the system font implementation in the presentation editor, providing users with access to native operating system fonts for better performance and native feel.

## Why System Fonts?

### ✅ Benefits

1. **Performance**: No network requests, no font file downloads
2. **Native Feel**: Text appears using the same fonts as the operating system
3. **Familiarity**: Users are comfortable with fonts they see daily
4. **Broad Language Support**: System fonts typically have extensive Unicode coverage
5. **Consistent Rendering**: Optimized for the specific operating system

### ⚠️ Considerations

1. **Cross-Platform Differences**: Text may look different on different operating systems
2. **Font Availability**: Not all fonts are available on all systems
3. **Presentation Portability**: Presentations may render differently when shared across platforms

## Implementation

### 1. CSS System Font Stacks

We use carefully crafted CSS font stacks that automatically select the best available system font:

```css
/* Primary system font (Sans-serif) */
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  Oxygen-Sans,
  Ubuntu,
  Cantarell,
  'Helvetica Neue',
  sans-serif;

/* System serif fonts */
font-family: 'New York', 'Times New Roman', Times, 'Droid Serif', 'Source Serif Pro', serif;

/* System monospace fonts */
font-family: 'SF Mono', Monaco, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace;
```

### 2. Platform-Specific Fonts

| Platform    | System Font      | Backup Fonts                  |
| ----------- | ---------------- | ----------------------------- |
| **macOS**   | San Francisco    | Helvetica Neue, Lucida Grande |
| **Windows** | Segoe UI         | Tahoma, Microsoft Sans Serif  |
| **Linux**   | Ubuntu/Cantarell | DejaVu Sans, Liberation Sans  |
| **Android** | Roboto           | Droid Sans                    |

### 3. Font Categories

#### System Fonts

- **System Default (Sans-serif)**: Native UI font of the operating system
- **System Serif**: Traditional serif fonts for formal presentations
- **System Monospace**: Fixed-width fonts for code or technical content

#### Web Safe Fonts

- Arial, Helvetica, Times New Roman, Georgia, Verdana, etc.
- Available on most systems as fallbacks

## Usage in Editor

### Font Selection

1. **Properties Panel**: Choose from categorized font lists
2. **System Font Priority**: System fonts appear first in the list
3. **Preview**: See how fonts look in real-time
4. **Fallback Chain**: Automatic graceful degradation if fonts aren't available

### Code Example

```tsx
// Using system font utilities
import { SYSTEM_FONT_STACKS, getFontDisplayName } from '@renderer/utils/fontUtils'

// Apply system font
element.style.fontFamily = SYSTEM_FONT_STACKS.sansSerif

// Get display name for UI
const displayName = getFontDisplayName(element.style.fontFamily)
// Returns: "System Default (Sans-serif)"
```

## Advanced Features

### Font Detection

```typescript
import { isFontAvailable } from '@renderer/utils/fontUtils'

// Check if a specific font is available
const hasHelvetica = isFontAvailable('Helvetica')
```

### Font Metrics

```typescript
import { getFontMetrics } from '@renderer/utils/fontUtils'

// Get font measurements for layout calculations
const metrics = getFontMetrics('system-ui', 16)
// Returns: { width: 9.6, height: 19.2 }
```

### System Font Enumeration

```typescript
import { getSystemFonts } from '@renderer/utils/fontUtils'

// Get list of available system fonts (advanced feature)
const fonts = await getSystemFonts()
```

## Best Practices

### 1. Font Selection Guidelines

- **Presentations**: Use system default for maximum readability
- **Titles**: System serif for formal presentations, system default for modern look
- **Code/Technical**: Always use system monospace
- **Branding**: Consider web safe fonts if brand consistency is critical

### 2. Cross-Platform Compatibility

- Test presentations on different operating systems
- Use system font stacks rather than specific font names
- Provide fallbacks for critical text

### 3. Performance Optimization

- Prefer system fonts over web fonts when possible
- Use font stacks to minimize font loading
- Avoid mixing too many different font families

## Future Enhancements

### Planned Features

1. **Real System Font Enumeration**: Integration with `font-list` package
2. **Font Preview**: Live preview of system fonts in font picker
3. **Font Pairing Suggestions**: Recommended font combinations
4. **Variable Font Support**: Support for system variable fonts

### Optional Package Integration

For advanced font enumeration, we can integrate packages like:

```bash
npm install font-list
# or
npm install node-system-fonts
```

This would enable:

- Real-time system font discovery
- Font metadata (weight, style, family)
- Font file path access
- Advanced font filtering

## Technical Details

### Font Stack Priority

1. **system-ui**: Generic system font (modern browsers)
2. **-apple-system**: macOS system font
3. **BlinkMacSystemFont**: Chrome on macOS
4. **Segoe UI**: Windows system font
5. **Roboto**: Android system font
6. **Platform-specific fonts**: Ubuntu, Cantarell, etc.
7. **Generic fallbacks**: sans-serif, serif, monospace

### Browser Support

- **system-ui**: Chrome 56+, Firefox 92+, Safari 11+
- **-apple-system**: Safari 9+, Chrome on macOS
- **BlinkMacSystemFont**: Chrome 48+ on macOS

### Electron Integration

System fonts work seamlessly in Electron because:

- Chromium rendering engine supports all modern CSS font features
- Access to native system fonts through OS APIs
- No CORS restrictions for local font access

## Troubleshooting

### Common Issues

1. **Font not appearing**: Check browser support for system-ui
2. **Different rendering**: Expected behavior across platforms
3. **Font metrics wrong**: Use font measurement utilities

### Debugging

```typescript
// Check what font is actually being used
const computedStyle = window.getComputedStyle(element)
console.log('Actual font:', computedStyle.fontFamily)

// Test font availability
console.log('Segoe UI available:', isFontAvailable('Segoe UI'))
```

## Conclusion

System fonts provide an excellent balance of performance, native feel, and broad compatibility. While they may render differently across platforms, this is often desirable for creating presentations that feel native to each operating system.

The implementation provides both simple CSS-based solutions and advanced programmatic access, allowing for flexibility based on specific needs.
