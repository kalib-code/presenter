import type { Setlist } from '@renderer/types/database'
import { formatTimeFromSeconds } from './time-utils'

/**
 * Export a setlist as plain text
 */
export function exportSetlistAsText(setlist: Setlist): string {
  const lines: string[] = []

  // Header
  lines.push(`${setlist.name}`)
  lines.push('='.repeat(setlist.name.length))
  lines.push('')

  if (setlist.description) {
    lines.push(`Description: ${setlist.description}`)
    lines.push('')
  }

  // Stats
  const totalDuration = setlist.items.reduce((total, item) => total + (item.duration || 0), 0)
  lines.push(`Items: ${setlist.items.length}`)
  lines.push(`Total Duration: ${formatTimeFromSeconds(totalDuration)}`)
  lines.push(`Created: ${new Date(setlist.createdAt).toLocaleDateString()}`)
  lines.push('')

  // Items
  lines.push('Items:')
  lines.push('------')

  setlist.items
    .sort((a, b) => a.order - b.order)
    .forEach((item, index) => {
      const duration = item.duration ? ` (${formatTimeFromSeconds(item.duration)})` : ''
      lines.push(`${index + 1}. ${item.title}${duration}`)

      if (item.notes) {
        lines.push(`   Notes: ${item.notes}`)
      }

      lines.push(`   Type: ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`)
      lines.push('')
    })

  // Tags
  if (setlist.tags.length > 0) {
    lines.push('Tags:')
    lines.push(setlist.tags.join(', '))
    lines.push('')
  }

  // Footer
  lines.push('---')
  lines.push(`Exported from Presenter on ${new Date().toLocaleDateString()}`)

  return lines.join('\n')
}

/**
 * Export a setlist as CSV
 */
export function exportSetlistAsCSV(setlist: Setlist): string {
  const headers = ['Order', 'Title', 'Type', 'Duration (seconds)', 'Duration (formatted)', 'Notes']
  const rows: string[][] = []

  // Add header row
  rows.push(headers)

  // Add data rows
  setlist.items
    .sort((a, b) => a.order - b.order)
    .forEach((item) => {
      rows.push([
        (item.order + 1).toString(),
        `"${item.title.replace(/"/g, '""')}"`, // Escape quotes
        item.type,
        (item.duration || 0).toString(),
        formatTimeFromSeconds(item.duration || 0),
        `"${(item.notes || '').replace(/"/g, '""')}"` // Escape quotes
      ])
    })

  return rows.map((row) => row.join(',')).join('\n')
}

/**
 * Export a setlist as JSON
 */
export function exportSetlistAsJSON(setlist: Setlist): string {
  const exportData = {
    ...setlist,
    exportedAt: new Date().toISOString(),
    exportedBy: 'Presenter App'
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  URL.revokeObjectURL(url)
}

/**
 * Generate a safe filename from setlist name
 */
export function generateFilename(setlistName: string, extension: string): string {
  // Remove invalid filename characters and replace with underscores
  const safeName = setlistName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase()

  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  return `${safeName}_${timestamp}.${extension}`
}

/**
 * Export setlist in multiple formats
 */
export function exportSetlist(setlist: Setlist, format: 'text' | 'csv' | 'json') {
  let content: string
  let filename: string
  let mimeType: string

  switch (format) {
    case 'text':
      content = exportSetlistAsText(setlist)
      filename = generateFilename(setlist.name, 'txt')
      mimeType = 'text/plain'
      break
    case 'csv':
      content = exportSetlistAsCSV(setlist)
      filename = generateFilename(setlist.name, 'csv')
      mimeType = 'text/csv'
      break
    case 'json':
      content = exportSetlistAsJSON(setlist)
      filename = generateFilename(setlist.name, 'json')
      mimeType = 'application/json'
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }

  downloadFile(content, filename, mimeType)
}

/**
 * Create a printable HTML version of the setlist
 */
export function createPrintableHTML(setlist: Setlist): string {
  const totalDuration = setlist.items.reduce((total, item) => total + (item.duration || 0), 0)

  const styles = `
    <style>
      @media print {
        body { margin: 0; }
        .no-print { display: none; }
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        line-height: 1.5;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        border-bottom: 2px solid #333;
        margin-bottom: 20px;
        padding-bottom: 10px;
      }
      .title {
        font-size: 28px;
        font-weight: bold;
        margin: 0;
      }
      .description {
        font-size: 16px;
        color: #666;
        margin: 5px 0 0 0;
      }
      .stats {
        display: flex;
        gap: 20px;
        margin: 15px 0;
        font-size: 14px;
        color: #666;
      }
      .items {
        margin-top: 20px;
      }
      .item {
        display: flex;
        align-items: flex-start;
        padding: 10px;
        border-bottom: 1px solid #eee;
      }
      .item:nth-child(even) {
        background-color: #f9f9f9;
      }
      .item-number {
        font-weight: bold;
        width: 30px;
        flex-shrink: 0;
      }
      .item-content {
        flex: 1;
      }
      .item-title {
        font-weight: bold;
        font-size: 16px;
      }
      .item-meta {
        font-size: 12px;
        color: #666;
        margin-top: 2px;
      }
      .item-notes {
        font-size: 14px;
        color: #555;
        margin-top: 5px;
        font-style: italic;
      }
      .item-duration {
        font-family: monospace;
        font-size: 14px;
        color: #666;
        width: 80px;
        text-align: right;
        flex-shrink: 0;
      }
      .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #999;
        text-align: center;
      }
      .tags {
        margin-top: 10px;
      }
      .tag {
        display: inline-block;
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        margin-right: 5px;
        margin-bottom: 3px;
      }
    </style>
  `

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${setlist.name} - Setlist</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1 class="title">${setlist.name}</h1>
        ${setlist.description ? `<p class="description">${setlist.description}</p>` : ''}
        <div class="stats">
          <div><strong>Items:</strong> ${setlist.items.length}</div>
          <div><strong>Duration:</strong> ${formatTimeFromSeconds(totalDuration)}</div>
          <div><strong>Created:</strong> ${new Date(setlist.createdAt).toLocaleDateString()}</div>
        </div>
        ${
          setlist.tags.length > 0
            ? `
          <div class="tags">
            <strong>Tags:</strong>
            ${setlist.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
          </div>
        `
            : ''
        }
      </div>
      
      <div class="items">
        ${setlist.items
          .sort((a, b) => a.order - b.order)
          .map(
            (item, index) => `
            <div class="item">
              <div class="item-number">${index + 1}.</div>
              <div class="item-content">
                <div class="item-title">${item.title}</div>
                <div class="item-meta">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</div>
                ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
              </div>
              <div class="item-duration">${formatTimeFromSeconds(item.duration || 0)}</div>
            </div>
          `
          )
          .join('')}
      </div>
      
      <div class="footer">
        Exported from Presenter on ${new Date().toLocaleDateString()}
      </div>
      
      <script>
        // Auto-print when opened (optional)
        // window.onload = () => window.print();
      </script>
    </body>
    </html>
  `

  return html
}

/**
 * Open a printable version of the setlist
 */
export function openPrintableSetlist(setlist: Setlist) {
  const html = createPrintableHTML(setlist)
  const newWindow = window.open('', '_blank')

  if (newWindow) {
    newWindow.document.write(html)
    newWindow.document.close()

    // Optional: Auto-print
    // newWindow.onload = () => {
    //   newWindow.print()
    // }
  } else {
    // Fallback: download as HTML file
    downloadFile(html, generateFilename(setlist.name, 'html'), 'text/html')
  }
}
