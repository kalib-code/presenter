# Setlist Layout Design Document

## Current Setlist Layout Analysis

### List View (Setlist Management)
The current setlist list view uses a traditional table-based layout:

```
Header: "Setlists" + New Setlist Button
Search Bar
Table Layout:
  ┌────────────────────────────────────────────────────────────────┐
  │ Name │ Description │ Items │ Duration │ Created │ Actions     │
  ├──────┼─────────────┼───────┼──────────┼─────────┼─────────────┤
  │ ...  │ ...         │ ...   │ ...      │ ...     │ View/Play/⋮ │
  └────────────────────────────────────────────────────────────────┘
```

**Current Features:**
- Table with 6 columns: Name, Description, Items, Duration, Created, Actions
- Inline item preview (first 3 items with icons)
- Hover effects and action buttons
- Search functionality
- Empty state with call-to-action

### Detail View (Setlist Items Management)
The current detail view uses a card-based layout with comprehensive functionality:

```
Navigation: Back Button
Header: Title + Description + Action Buttons (Add Item, Select Mode, Present, ⋮)
Stats Cards: Items Count | Total Duration | Songs Count
Items List:
  ┌──────────────────────────────────────────────────────────────┐
  │ [#] [Icon] Title                     Duration  Notes   [⋮]   │
  │     Type                                                     │
  ├──────────────────────────────────────────────────────────────┤
  │ ...                                                          │
  └──────────────────────────────────────────────────────────────┘
```

**Current Features:**
- Drag & drop reordering
- Inline editing (title, duration, notes)
- Bulk selection mode
- Item type indicators with colored icons
- Stats dashboard
- Rich add item modal with categories
- Media selector integration

---

## Proposed New Setlist Layout

### Enhanced List View (Grid + List Hybrid)
Replace the table with a more modern, visual approach:

```
Header: "Setlists" + Quick Actions (New, Templates)
Search Bar + Filters (Date, Duration, Tags)

View Toggle: [Grid View] [List View]

Grid View:
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ [Thumbnail]     │ │ [Thumbnail]     │ │ [Thumbnail]     │
│ Setlist Name    │ │ Setlist Name    │ │ Setlist Name    │
│ 12 items • 45m  │ │ 8 items • 32m   │ │ 6 items • 28m   │
│ [▶] [⋮]        │ │ [▶] [⋮]        │ │ [▶] [⋮]        │
└─────────────────┘ └─────────────────┘ └─────────────────┘

Enhanced List View:
┌──────────────────────────────────────────────────────────────────┐
│ [Preview] Setlist Name                              [▶] [⋮]      │
│           Description • 12 items • 45m • Yesterday              │
│           [Song Icon][Presentation Icon][Timer Icon]...         │
└──────────────────────────────────────────────────────────────────┘
```

**New Features:**
- Visual thumbnails/previews of first few items
- Grid and list view toggle options
- Enhanced filtering by date, duration, tags
- Better visual hierarchy with cards
- Improved responsive design

### Redesigned Detail View (Three-Panel Layout)
Transform into a more professional, production-ready layout:

```
┌──────────────┬─────────────────────────┬─────────────────────┐
│   SETLIST    │      ITEM DETAILS       │     PREVIEW         │
│   BROWSER    │                         │                     │
├──────────────┤                         │                     │
│ 1. [♪] Song  │  Selected Item:         │  ┌─────────────────┐ │
│ 2. [📊] Pres │  Amazing Grace          │  │                 │ │
│ 3. [⏱] Timer│                         │  │   Item Preview  │ │
│ 4. [♪] Song  │  Duration: 4:30         │  │    Content      │ │
│ 5. [📊] Pres │  Notes: Key of G        │  │                 │ │
│              │                         │  └─────────────────┘ │
│ [+ Add Item] │  [Edit] [Remove]        │                     │
│              │                         │  [Quick Actions]    │
│              │  ┌─────────────────────┐ │                     │
│              │  │   Item Properties   │ │  Next Up:           │
│              │  │   Editor Panel      │ │  How Great Thou Art │
│              │  │                     │ │                     │
│              │  └─────────────────────┘ │                     │
└──────────────┴─────────────────────────┴─────────────────────┘
```

**New Features:**
- Three-panel layout for efficient workflow
- Live item preview panel
- Integrated property editor
- Real-time setlist browser navigation
- Next item indicator
- Quick action buttons
- Better visual separation of concerns

---

## Key Setlist Improvements Summary

### Visual Design
- **Grid view option** for setlist overview with visual cards
- **Thumbnail previews** showing first few items for quick identification
- **Three-panel layout** for efficient setlist management workflow
- **Item preview integration** for real-time content preview

### User Experience
- **Faster navigation** with visual cues and better organization
- **Enhanced filtering** by date, duration, and tags
- **Better visual hierarchy** with card-based layouts
- **Improved responsive design** for different screen sizes

### Functionality
- **Enhanced search and filtering** capabilities
- **Visual setlist browser** with drag & drop
- **Integrated item property editor**
- **Real-time item preview** panel
- **Better bulk operations** with improved selection interface

### Technical Benefits
- **More modular component structure** for setlist management
- **Better responsive design** across devices
- **Improved performance** with efficient rendering
- **Enhanced accessibility** features

---

## Implementation Priority

### Phase 1: List View Enhancement
1. Add grid/list view toggle functionality
2. Implement card-based layout for grid view
3. Add enhanced filtering options (date, duration, tags)
4. Improve search functionality with better visual results

### Phase 2: Detail View Redesign
1. Implement three-panel layout structure
2. Add item preview panel on the right
3. Create integrated item property editor
4. Enhance setlist browser navigation on the left

### Phase 3: Polish & Integration
1. Add smooth animations and transitions
2. Implement keyboard shortcuts for setlist management
3. Add visual feedback for drag & drop operations
4. Performance optimizations for large setlists

This new setlist design maintains all current functionality while providing a more modern, efficient, and user-friendly interface specifically focused on setlist management and preparation workflows.