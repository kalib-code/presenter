# Custom Font Support

The presentation editor now supports uploading and using custom fonts from third-party sources. This feature allows you to use any font file in your presentations, providing complete creative freedom for your design.

## Features

### ✨ **Supported Font Formats**

- **TTF** (TrueType Font) - Most common format
- **OTF** (OpenType Font) - Adobe's modern format
- **WOFF** (Web Open Font Format) - Optimized for web
- **WOFF2** (Web Open Font Format 2.0) - Better compression
- **EOT** (Embedded OpenType) - Legacy IE support

### 🎯 **Key Capabilities**

- **Multi-file Upload** - Select multiple font files at once
- **Automatic Font Loading** - Fonts are loaded into CSS immediately
- **Live Preview** - See fonts in action before applying
- **Font Management** - Upload, preview, and delete custom fonts
- **Seamless Integration** - Custom fonts appear alongside system fonts
- **Persistent Storage** - Fonts are saved locally for future use

## How to Use Custom Fonts

### 1. **Upload Fonts**

1. Open the presentation editor
2. Select a text element
3. In the Properties Panel, click "Manage" next to Font Family
4. Click "Upload Fonts" in the Custom Font Manager
5. Select your font files (TTF, OTF, WOFF, WOFF2, or EOT)
6. Click "Open" to upload

### 2. **Apply Custom Fonts**

**Method 1: From Font Manager**

1. Open the Custom Font Manager
2. Find your font in the list
3. Click "Use" to apply it to the selected text element

**Method 2: From Font Dropdown**

1. Select a text element
2. Open the Font Family dropdown
3. Custom fonts appear at the top under "Custom Fonts"
4. Select your desired font

### 3. **Manage Fonts**

- **Preview**: See how fonts look with sample text
- **Delete**: Remove fonts you no longer need
- **File Info**: View file size, upload date, and original filename

## Technical Implementation

### Font Storage

- Fonts are stored locally in the user data directory
- Path: `userData/custom-fonts/`
- Files are renamed with timestamps to prevent conflicts
- Original filenames are preserved in metadata

### Font Loading

- Fonts are loaded using the CSS Font Loading API
- `FontFace` objects are created and added to `document.fonts`
- Fonts are loaded automatically on app startup
- Failed loads are logged but don't break the app

### Font Stacks

Custom fonts are wrapped in proper font stacks with fallbacks:

```css
"Custom Font Name", system-ui, -apple-system, BlinkMacSystemFont, sans-serif
```

### File Validation

- **Size Limit**: 10MB per file
- **Format Check**: Extension validation
- **Error Handling**: Clear error messages for invalid files

## Font Management API

### Core Functions

```typescript
// Upload fonts via file dialog
uploadCustomFonts(): Promise<FontUploadResult>

// Get list of installed custom fonts
getCustomFonts(): Promise<CustomFont[]>

// Delete a custom font
deleteCustomFont(fontId: string): Promise<{success: boolean, message: string}>

// Load font into CSS
loadCustomFont(font: CustomFont): Promise<boolean>

// Load all custom fonts
loadAllCustomFonts(): Promise<void>

// Create font stack with fallbacks
createCustomFontStack(fontName: string, fallbacks?: string[]): string
```

### Data Types

```typescript
interface CustomFont {
  id: string // Unique identifier (timestamp)
  name: string // Display name (cleaned from filename)
  fileName: string // Actual filename on disk
  originalName: string // Original uploaded filename
  filePath: string // Full path to font file
  fileSize: number // File size in bytes
  uploadDate: string // ISO date string
  type: 'custom' // Font type identifier
}
```

## Best Practices

### 🎨 **Font Selection**

- **Readability**: Choose fonts that are easy to read at presentation distances
- **Consistency**: Use 2-3 fonts maximum per presentation
- **Contrast**: Ensure good contrast between text and background
- **Licensing**: Only use fonts you have proper licenses for

### 📁 **File Management**

- **Organize**: Keep font files organized on your computer
- **Backup**: Back up your font files separately
- **Cleanup**: Remove unused fonts to save space
- **Version Control**: Keep track of font versions and updates

### ⚡ **Performance**

- **File Size**: Smaller font files load faster
- **Format Choice**: WOFF2 offers the best compression
- **Subset Fonts**: Use tools to create subsets for specific character sets
- **Limit Fonts**: Don't upload too many fonts at once

## Troubleshooting

### Font Not Appearing

1. **Check Format**: Ensure the font file is in a supported format
2. **File Size**: Verify the file is under 10MB
3. **Reload**: Try refreshing the font list
4. **Console**: Check browser console for error messages

### Font Loading Issues

1. **File Corruption**: Try re-uploading the font file
2. **Browser Cache**: Clear browser cache and reload
3. **Font Conflicts**: Check if font name conflicts with system fonts
4. **Permissions**: Ensure the app has file system permissions

### Performance Issues

1. **Too Many Fonts**: Reduce the number of uploaded fonts
2. **Large Files**: Use compressed font formats (WOFF2)
3. **Memory Usage**: Restart the app if fonts consume too much memory

## Security Considerations

### File Validation

- All uploaded files are validated for format and size
- Files are stored in a sandboxed directory
- No executable code is processed from font files

### Storage Security

- Fonts are stored locally, not transmitted over network
- File paths are validated to prevent directory traversal
- User data directory is protected by OS permissions

## Future Enhancements

### Planned Features

- **Font Subsetting**: Automatically create subsets for better performance
- **Google Fonts Integration**: Direct access to Google Fonts library
- **Font Pairing Suggestions**: AI-powered font combination recommendations
- **Variable Font Support**: Support for variable font axes
- **Font Preview Improvements**: Better preview with custom text
- **Bulk Font Management**: Import/export font collections
- **Font Metadata**: Display font family, weight, and style information

### Advanced Features

- **Font Optimization**: Automatic font file optimization
- **Character Set Analysis**: Show which characters are available
- **Font Licensing Info**: Display and track font licenses
- **Cloud Font Storage**: Sync fonts across devices
- **Font Usage Analytics**: Track which fonts are used most

## License and Legal

### Font Licensing

- **User Responsibility**: Users are responsible for font licensing
- **Commercial Use**: Ensure fonts are licensed for commercial use if applicable
- **Distribution**: Don't distribute copyrighted fonts without permission
- **Attribution**: Follow font license attribution requirements

### Supported License Types

- **Open Source**: SIL Open Font License, Apache License, etc.
- **Commercial**: Purchased fonts with appropriate licenses
- **Free for Personal Use**: Non-commercial use only
- **Custom Licenses**: Fonts with specific licensing terms

---

## Support

For issues, questions, or feature requests related to custom fonts:

1. **Check Documentation**: Review this guide and troubleshooting section
2. **Console Logs**: Check browser developer console for error messages
3. **File Issues**: Report bugs with specific font files and error details
4. **Feature Requests**: Suggest improvements and new font-related features

The custom font system is designed to be robust and user-friendly while providing professional-grade typography capabilities for your presentations.
