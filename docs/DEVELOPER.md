# Developer Guide - Presenter Application

## Table of Contents
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Code Organization](#code-organization)
- [Coding Standards](#coding-standards)
- [Testing Strategy](#testing-strategy)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

#### Required Software
- **Node.js**: LTS version (18.x or higher)
- **npm** or **pnpm**: Package manager
- **Git**: Version control
- **VS Code** (recommended) or preferred IDE

#### Recommended VS Code Extensions
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- React snippets
- Electron snippets

### System Requirements

#### Development Machine
- **OS**: Windows 10+, macOS 10.14+, Ubuntu 20.04+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **Display**: 1920x1080 minimum for testing multi-display

## Project Setup

### Initial Setup

1. **Clone the repository**
```bash
git clone [repository-url]
cd presenter
```

2. **Navigate to project directory**
```bash
cd presenter
```

3. **Install dependencies**
```bash
npm install
# or
pnpm install
```

4. **Verify installation**
```bash
npm run dev
```

### Environment Configuration

Create a `.env.local` file for local development:
```env
# Development settings
VITE_DEV_SERVER_PORT=5173
ELECTRON_IS_DEV=1

# Feature flags (optional)
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_LOGGING=true
```

## Development Workflow

### Starting Development

```bash
# Start development server with hot reload
npm run dev

# The application will open automatically
# Main window: http://localhost:5173
# Electron app launches with DevTools
```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Check TypeScript types |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Open Vitest UI |

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run build:win` | Build for Windows |
| `npm run build:mac` | Build for macOS |
| `npm run build:linux` | Build for Linux |
| `npm run build:unpack` | Build unpacked version |

## Code Organization

### Directory Structure

```
presenter/
├── src/
│   ├── main/              # Main process code
│   │   ├── index.ts       # Entry point, IPC handlers
│   │   └── types/         # Shared types
│   │
│   ├── preload/           # Preload scripts
│   │   └── index.ts       # Context bridge setup
│   │
│   └── renderer/          # Renderer process (React)
│       └── src/
│           ├── components/  # React components
│           ├── pages/      # Page components
│           ├── store/      # Zustand stores
│           ├── hooks/      # Custom hooks
│           ├── lib/        # Utilities
│           └── types/      # TypeScript types
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `EditorCanvas.tsx` |
| **Pages** | PascalCase | `Settings.tsx` |
| **Stores** | kebab-case | `editor-slides.ts` |
| **Utilities** | camelCase | `mediaUtils.ts` |
| **Types** | PascalCase | `Database.ts` |
| **Hooks** | camelCase with 'use' | `useMediaQuery.ts` |

### Import Order

```typescript
// 1. External libraries
import React from 'react'
import { create } from 'zustand'

// 2. Internal absolute imports
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/store/settings'

// 3. Relative imports
import { Canvas } from './Canvas'
import type { CanvasProps } from './types'

// 4. Style imports
import './styles.css'
```

## Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// ✅ Good: Use interface for objects
interface User {
  id: string
  name: string
  email: string
}

// ✅ Good: Use type for unions/intersections
type Status = 'idle' | 'loading' | 'success' | 'error'
type WithTimestamp<T> = T & { timestamp: number }

// ❌ Bad: Using 'any'
const processData = (data: any) => { /* ... */ }

// ✅ Good: Proper typing
const processData = (data: unknown) => {
  // Type guard or validation
}
```

#### Component Props
```typescript
// ✅ Good: Typed props with interface
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  onClick,
  children 
}) => {
  // Component implementation
}
```

### React Best Practices

#### Component Structure
```typescript
// ✅ Good: Functional component with hooks
function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 1. Hooks
  const [state, setState] = useState()
  const store = useStore()
  
  // 2. Derived state
  const derivedValue = useMemo(() => {
    return computeExpensiveValue(state)
  }, [state])
  
  // 3. Effects
  useEffect(() => {
    // Side effects
  }, [dependency])
  
  // 4. Handlers
  const handleClick = useCallback(() => {
    // Handle action
  }, [dependency])
  
  // 5. Render
  return <div>{/* JSX */}</div>
}
```

#### State Management
```typescript
// ✅ Good: Zustand store with TypeScript
interface StoreState {
  items: Item[]
  selectedId: string | null
}

interface StoreActions {
  addItem: (item: Item) => void
  selectItem: (id: string) => void
  clearSelection: () => void
}

const useStore = create<StoreState & StoreActions>()((set) => ({
  items: [],
  selectedId: null,
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  
  selectItem: (id) => set({ selectedId: id }),
  
  clearSelection: () => set({ selectedId: null })
}))
```

### CSS/Styling Guidelines

#### Tailwind Classes
```tsx
// ✅ Good: Organized classes with cn()
import { cn } from '@/lib/utils'

<div 
  className={cn(
    'flex items-center justify-between',
    'px-4 py-2',
    'bg-white dark:bg-gray-800',
    'border rounded-lg',
    isActive && 'border-blue-500',
    className
  )}
/>

// ❌ Bad: Long unorganized string
<div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg">
```

## Testing Strategy

### Test Structure

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
├── store/
│   ├── settings.ts
│   └── __tests__/
│       └── settings.test.ts
└── lib/
    ├── utils.ts
    └── utils.test.ts
```

### Writing Tests

#### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### Store Testing
```typescript
import { renderHook, act } from '@testing-library/react'
import { useSettingsStore } from './settings'

describe('Settings Store', () => {
  beforeEach(() => {
    useSettingsStore.setState({ theme: 'light' })
  })
  
  it('updates theme', () => {
    const { result } = renderHook(() => useSettingsStore())
    
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(result.current.theme).toBe('dark')
  })
})
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test Button.test.tsx

# Open Vitest UI
npm run test:ui
```

## Debugging

### Electron DevTools

#### Main Process Debugging
1. Add debugger statement or console.log
2. Check terminal output
3. Use VS Code debugger with launch config

#### Renderer Process Debugging
1. Open DevTools: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
2. Use React Developer Tools
3. Check Console, Network, Performance tabs

### VS Code Debug Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["."],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "protocol": "inspector"
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": [
        "${workspaceFolder}",
        "--remote-debugging-port=9222"
      ],
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

### Common Debugging Tips

1. **IPC Issues**: Add logging to both main and renderer
```typescript
// Main process
ipcMain.handle('my-channel', async (event, data) => {
  console.log('[Main] Received:', data)
  const result = await processData(data)
  console.log('[Main] Sending:', result)
  return result
})

// Renderer
const result = await window.electron.invoke('my-channel', data)
console.log('[Renderer] Received:', result)
```

2. **State Issues**: Use Zustand DevTools
```typescript
import { devtools } from 'zustand/middleware'

const useStore = create()(
  devtools(
    (set) => ({
      // Store implementation
    }),
    { name: 'MyStore' }
  )
)
```

## Common Tasks

### Adding a New Page

1. **Create page component**
```typescript
// src/renderer/src/pages/MyPage.tsx
export function MyPage() {
  return (
    <div className="p-4">
      <h1>My Page</h1>
      {/* Page content */}
    </div>
  )
}
```

2. **Add route**
```typescript
// src/renderer/src/App.tsx
<Route path="/my-page" element={<MyPage />} />
```

3. **Add navigation**
```typescript
// Update sidebar or navigation
{
  label: 'My Page',
  path: '/my-page',
  icon: IconComponent
}
```

### Adding a New Store

1. **Create store file**
```typescript
// src/renderer/src/store/my-feature.ts
import { create } from 'zustand'

interface MyFeatureState {
  data: any[]
  loading: boolean
}

interface MyFeatureActions {
  loadData: () => Promise<void>
  clearData: () => void
}

export const useMyFeatureStore = create<MyFeatureState & MyFeatureActions>()(
  (set) => ({
    data: [],
    loading: false,
    
    loadData: async () => {
      set({ loading: true })
      // Load data
      set({ data: newData, loading: false })
    },
    
    clearData: () => set({ data: [] })
  })
)
```

2. **Use in component**
```typescript
function MyComponent() {
  const { data, loading, loadData } = useMyFeatureStore()
  
  useEffect(() => {
    loadData()
  }, [])
  
  // Render component
}
```

### Adding IPC Handler

1. **Main process handler**
```typescript
// src/main/index.ts
ipcMain.handle('my-operation', async (event, param1, param2) => {
  // Validate input
  if (!param1) throw new Error('param1 required')
  
  // Perform operation
  const result = await performOperation(param1, param2)
  
  return result
})
```

2. **Renderer usage**
```typescript
// src/renderer/src/lib/api.ts
export async function myOperation(param1: string, param2?: number) {
  return window.electron.invoke('my-operation', param1, param2)
}

// In component
const result = await myOperation('value', 42)
```

### Working with Media Files

1. **Upload media**
```typescript
async function uploadMedia(file: File) {
  // Convert to base64
  const base64 = await fileToBase64(file)
  
  // Save via IPC
  const result = await window.electron.invoke('save-media-file', {
    filename: file.name,
    data: base64,
    type: 'base64'
  })
  
  return result
}
```

2. **Display media**
```typescript
function MediaDisplay({ filename }: { filename: string }) {
  const [url, setUrl] = useState<string>()
  
  useEffect(() => {
    window.electron.invoke('get-media-file-url', filename)
      .then(setUrl)
  }, [filename])
  
  return url ? <img src={url} /> : <Skeleton />
}
```

## Contributing

### Branch Strategy

- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Emergency fixes

### Commit Messages

Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Examples:
```bash
feat(editor): add undo/redo functionality
fix(canvas): resolve drag and drop issue on Firefox
docs(api): update IPC handler documentation
```

### Pull Request Process

1. **Create feature branch**
```bash
git checkout -b feature/my-feature
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: add new feature"
```

3. **Push branch**
```bash
git push origin feature/my-feature
```

4. **Create PR with:**
   - Clear title and description
   - Link to related issues
   - Screenshots/videos if UI changes
   - Test coverage

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] TypeScript types are correct
- [ ] No console.log statements
- [ ] Documentation updated
- [ ] Performance considered
- [ ] Security reviewed
- [ ] Accessibility maintained

## Troubleshooting

### Common Issues

#### Build Failures

**Issue**: `electron-builder` fails
```bash
# Solution: Clear cache and rebuild
rm -rf node_modules dist out
npm install
npm run build
```

**Issue**: Native module errors
```bash
# Solution: Rebuild native modules
npm run postinstall
# or
electron-builder install-app-deps
```

#### Development Issues

**Issue**: Hot reload not working
```bash
# Solution: Restart dev server
# Kill all node processes
pkill -f node
# or on Windows
taskkill /f /im node.exe

# Start fresh
npm run dev
```

**Issue**: IPC not responding
```typescript
// Check preload script is loaded
console.log('window.electron:', window.electron)

// Verify handler exists in main
console.log('Handler registered')
```

#### Database Issues

**Issue**: LMDB errors
```bash
# Solution: Clear database
rm -rf ~/Library/Application Support/presenter/*.lmdb
# or on Windows
del %APPDATA%\presenter\*.lmdb
```

### Performance Optimization

#### Rendering Performance
1. Use `React.memo` for expensive components
2. Implement virtualization for long lists
3. Debounce frequent updates
4. Use `useMemo` and `useCallback` appropriately

#### Memory Management
1. Clean up event listeners
2. Cancel async operations in cleanup
3. Clear timers and intervals
4. Dispose of large objects

#### Bundle Size
1. Analyze bundle:
```bash
npm run build -- --analyze
```

2. Code splitting:
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

3. Tree shaking:
- Import specific functions
- Remove unused code
- Check dependencies

### Getting Help

1. **Documentation**: Check `/docs` folder
2. **Issues**: Search/create GitHub issues
3. **Discussions**: GitHub Discussions
4. **Discord**: Community support (if available)

### Useful Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)