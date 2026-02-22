# DevForge AI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cross-platform, AI-supercharged developer toolbox desktop app with 20+ deterministic utilities, global hotkey summon, smart clipboard detection, and integrated AI features (Ollama local + OpenAI/Anthropic/Google cloud).

**Architecture:** Electron app with context bridge IPC security model. React 19 renderer with plugin registry pattern for tools. AI providers abstracted behind a common streaming interface in the main process. All crypto/clipboard/AI operations in main process, never renderer.

**Tech Stack:** electron-vite, React 19, TypeScript, TailwindCSS v4, shadcn/ui, Monaco Editor (lazy), Zustand, cmdk, electron-store, OpenAI SDK, Anthropic SDK, Google Generative AI SDK, Ollama HTTP API.

---

## Phase 1: MVP Core

### Task 1: Scaffold Electron + React + Vite Project

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
- Create: `src/main/index.ts`
- Create: `src/preload/index.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `.gitignore`
- Create: `.prettierrc`

**Step 1: Initialize project with electron-vite**

```bash
npm create @electron-vite@latest devforge-temp -- --template react-ts
```

Copy the generated scaffold into our project root, then customize.

**Step 2: Install core dependencies**

```bash
npm install electron-store zustand
npm install -D tailwindcss @tailwindcss/vite typescript electron electron-vite \
  @types/react @types/react-dom react react-dom vite
```

**Step 3: Configure electron.vite.config.ts**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    }
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer')
      }
    }
  }
})
```

**Step 4: Create minimal main process**

`src/main/index.ts`:
```typescript
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 15, y: 10 },
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

**Step 5: Create preload bridge**

`src/preload/index.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  clipboard: {
    read: (): Promise<string> => ipcRenderer.invoke('clipboard:read'),
    write: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:write', text),
    detectType: (): Promise<{ toolId: string; content: string }> =>
      ipcRenderer.invoke('clipboard:detect')
  },
  window: {
    minimize: (): void => ipcRenderer.send('window:minimize'),
    hide: (): void => ipcRenderer.send('window:hide')
  },
  onClipboardContent: (callback: (data: { toolId: string; content: string }) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, data: { toolId: string; content: string }) => callback(data)
    ipcRenderer.on('clipboard:content', sub)
    return () => ipcRenderer.removeListener('clipboard:content', sub)
  }
}

contextBridge.exposeInMainWorld('api', api)
```

`src/preload/types.ts`:
```typescript
export interface ElectronAPI {
  clipboard: {
    read(): Promise<string>
    write(text: string): Promise<void>
    detectType(): Promise<{ toolId: string; content: string }>
  }
  window: {
    minimize(): void
    hide(): void
  }
  onClipboardContent(callback: (data: { toolId: string; content: string }) => void): () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
```

**Step 6: Create minimal React app**

`src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DevForge AI</title>
</head>
<body class="bg-zinc-950 text-zinc-100">
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

`src/renderer/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`src/renderer/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="flex h-screen w-screen">
      <div className="flex items-center justify-center flex-1">
        <h1 className="text-2xl font-bold">DevForge AI</h1>
      </div>
    </div>
  )
}
```

`src/renderer/styles/globals.css`:
```css
@import 'tailwindcss';
```

**Step 7: Verify it runs**

```bash
npm run dev
```

Expected: Electron window opens showing "DevForge AI" text on dark background.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold electron-vite + React + TypeScript + TailwindCSS project"
```

---

### Task 2: Global Hotkey, System Tray, Clipboard IPC

**Files:**
- Modify: `src/main/index.ts`
- Create: `src/main/tray.ts`
- Create: `src/main/ipc/clipboard.ts`
- Create: `src/main/ipc/system.ts`
- Create: `src/main/services/clipboard-detector.ts`
- Create: `resources/iconTemplate.png` (tray icon)
- Create: `resources/iconTemplate@2x.png`

**Step 1: Create clipboard detector service**

`src/main/services/clipboard-detector.ts`:
```typescript
interface DetectionResult {
  toolId: string
  content: string
  confidence: number
}

interface DetectorRule {
  toolId: string
  pattern: RegExp
  priority: number
}

const rules: DetectorRule[] = [
  { toolId: 'jwt-debugger', pattern: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, priority: 100 },
  { toolId: 'json-formatter', pattern: /^\s*[\[{][\s\S]*[\]}]\s*$/, priority: 90 },
  { toolId: 'xml-formatter', pattern: /^\s*<\?xml[\s\S]*/, priority: 85 },
  { toolId: 'html-formatter', pattern: /^\s*<!DOCTYPE[\s\S]*|^\s*<html[\s\S]*/i, priority: 84 },
  { toolId: 'unix-timestamp', pattern: /^\d{10,13}$/, priority: 80 },
  { toolId: 'base64', pattern: /^[A-Za-z0-9+/]{20,}={0,2}$/, priority: 70 },
  { toolId: 'url-encoder', pattern: /^https?:\/\/.+/, priority: 60 },
  { toolId: 'uuid-generator', pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, priority: 50 },
  { toolId: 'regex-tester', pattern: /^\/.*\/[gimsuy]*$/, priority: 40 },
]

export function detectClipboardType(text: string): DetectionResult {
  const trimmed = text.trim()
  if (!trimmed) return { toolId: 'json-formatter', content: trimmed, confidence: 0 }

  const sorted = [...rules].sort((a, b) => b.priority - a.priority)
  for (const rule of sorted) {
    if (rule.pattern.test(trimmed)) {
      return { toolId: rule.toolId, content: trimmed, confidence: rule.priority }
    }
  }

  return { toolId: 'json-formatter', content: trimmed, confidence: 0 }
}
```

**Step 2: Create clipboard IPC handler**

`src/main/ipc/clipboard.ts`:
```typescript
import { ipcMain, clipboard } from 'electron'
import { detectClipboardType } from '../services/clipboard-detector'

export function registerClipboardHandlers(): void {
  ipcMain.handle('clipboard:read', () => {
    return clipboard.readText()
  })

  ipcMain.handle('clipboard:write', (_event, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle('clipboard:detect', () => {
    const text = clipboard.readText()
    return detectClipboardType(text)
  })
}
```

**Step 3: Create system IPC handler**

`src/main/ipc/system.ts`:
```typescript
import { ipcMain, BrowserWindow } from 'electron'

export function registerSystemHandlers(): void {
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:hide', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.hide()
  })
}
```

**Step 4: Create system tray**

`src/main/tray.ts`:
```typescript
import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(showWindow: () => void): Tray {
  const iconPath = join(__dirname, '../../resources/iconTemplate.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('DevForge AI')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show DevForge AI', click: showWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', showWindow)

  return tray
}
```

**Step 5: Update main process with global hotkey + tray + IPC**

Update `src/main/index.ts` to:
- Register global shortcut (Alt+Space / Option+Space)
- Create system tray
- Register all IPC handlers
- On summon: read clipboard, detect type, send to renderer, show window

```typescript
import { app, BrowserWindow, shell, globalShortcut } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerClipboardHandlers } from './ipc/clipboard'
import { registerSystemHandlers } from './ipc/system'
import { createTray } from './tray'
import { detectClipboardType } from './services/clipboard-detector'
import { clipboard } from 'electron'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 15, y: 10 },
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function showAndFocus(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()

  // Auto-detect clipboard content and send to renderer
  const text = clipboard.readText()
  if (text) {
    const detected = detectClipboardType(text)
    mainWindow.webContents.send('clipboard:content', detected)
  }
}

app.whenReady().then(() => {
  registerClipboardHandlers()
  registerSystemHandlers()

  createWindow()
  createTray(showAndFocus)

  // Global hotkey: Alt+Space (Option+Space on macOS)
  globalShortcut.register('Alt+Space', showAndFocus)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

**Step 6: Create a simple tray icon placeholder**

Create a 32x32 PNG at `resources/iconTemplate.png` (can be a simple wrench/gear icon — we'll replace later). For now use a 1px transparent PNG as placeholder.

**Step 7: Verify hotkey + tray work**

```bash
npm run dev
```

Expected: App starts with system tray. Pressing Alt+Space brings window to focus. Clipboard content is detected.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add global hotkey, system tray, clipboard detection IPC"
```

---

### Task 3: Install and Configure shadcn/ui + Theme System

**Files:**
- Create: `components.json` (shadcn config)
- Create: `src/renderer/lib/utils.ts` (cn utility)
- Modify: `src/renderer/styles/globals.css` (CSS variables + theme)
- Modify: `package.json` (add shadcn deps)

**Step 1: Install shadcn/ui dependencies**

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install -D @types/node
```

**Step 2: Create cn utility**

`src/renderer/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 3: Set up dark-first theme CSS variables**

Update `src/renderer/styles/globals.css`:
```css
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar-background: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  /* Dark theme as default */
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.17 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.17 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.7 0.15 250);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.25 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.25 0 0);
  --muted-foreground: oklch(0.65 0 0);
  --accent: oklch(0.25 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.3 0 0);
  --input: oklch(0.3 0 0);
  --ring: oklch(0.7 0.15 250);
  --sidebar-background: oklch(0.12 0 0);
  --sidebar-foreground: oklch(0.85 0 0);
  --sidebar-border: oklch(0.25 0 0);
  --sidebar-accent: oklch(0.2 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
}

.light {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(0.97 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(0.97 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.55 0.15 250);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.93 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.93 0 0);
  --muted-foreground: oklch(0.45 0 0);
  --accent: oklch(0.93 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.88 0 0);
  --input: oklch(0.88 0 0);
  --ring: oklch(0.55 0.15 250);
  --sidebar-background: oklch(0.95 0 0);
  --sidebar-foreground: oklch(0.3 0 0);
  --sidebar-border: oklch(0.88 0 0);
  --sidebar-accent: oklch(0.93 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
}

body {
  @apply bg-background text-foreground;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

/* Drag region for frameless window */
.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: oklch(0.35 0 0);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: oklch(0.45 0 0);
}
```

**Step 4: Create shadcn components.json**

`components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/renderer/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Step 5: Add base shadcn/ui components we need**

```bash
npx shadcn@latest add button input scroll-area separator tooltip badge dialog tabs
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: configure shadcn/ui with dark-first theme system"
```

---

### Task 4: Core Layout — Sidebar + Title Bar + Tool Shell

**Files:**
- Create: `src/renderer/components/layout/TitleBar.tsx`
- Create: `src/renderer/components/layout/Sidebar.tsx`
- Create: `src/renderer/components/layout/ToolShell.tsx`
- Create: `src/renderer/components/shared/CopyButton.tsx`
- Create: `src/renderer/components/shared/ToolHeader.tsx`
- Create: `src/renderer/components/shared/OutputPanel.tsx`
- Create: `src/renderer/tools/types.ts`
- Create: `src/renderer/tools/registry.ts`
- Create: `src/renderer/stores/settings.ts`
- Modify: `src/renderer/App.tsx`

**Step 1: Create tool types**

`src/renderer/tools/types.ts`:
```typescript
import { type LucideIcon } from 'lucide-react'
import { type LazyExoticComponent, type ComponentType } from 'react'

export type ToolCategory = 'formatters' | 'encoders' | 'converters' | 'generators' | 'inspectors' | 'ai'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: LucideIcon
  clipboardPatterns?: { pattern: RegExp; priority: number }[]
  keywords: string[] // for command palette search
  component: LazyExoticComponent<ComponentType>
  aiEnabled?: boolean
}

export const categoryLabels: Record<ToolCategory, string> = {
  formatters: 'Formatters & Minifiers',
  encoders: 'Encoders & Decoders',
  converters: 'Converters',
  generators: 'Generators',
  inspectors: 'Inspectors & Text',
  ai: 'AI Tools'
}

export const categoryOrder: ToolCategory[] = [
  'formatters', 'encoders', 'converters', 'generators', 'inspectors', 'ai'
]
```

**Step 2: Create empty tool registry**

`src/renderer/tools/registry.ts`:
```typescript
import { type ToolDefinition } from './types'

// Tools will self-register here. Import order determines sidebar order within categories.
const tools: ToolDefinition[] = []

export function registerTool(tool: ToolDefinition): void {
  if (!tools.find(t => t.id === tool.id)) {
    tools.push(tool)
  }
}

export function getTools(): ToolDefinition[] {
  return tools
}

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find(t => t.id === id)
}

export function getToolsByCategory(category: string): ToolDefinition[] {
  return tools.filter(t => t.category === category)
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.toLowerCase()
  return tools.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.keywords.some(k => k.toLowerCase().includes(q))
  )
}
```

**Step 3: Create Zustand settings store**

`src/renderer/stores/settings.ts`:
```typescript
import { create } from 'zustand'

interface SettingsState {
  activeTool: string
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
  setActiveTool: (toolId: string) => void
  toggleSidebar: () => void
  setTheme: (theme: 'dark' | 'light') => void
}

export const useSettings = create<SettingsState>((set) => ({
  activeTool: 'json-formatter',
  sidebarCollapsed: false,
  theme: 'dark',
  setActiveTool: (toolId) => set({ activeTool: toolId }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTheme: (theme) => {
    document.documentElement.classList.toggle('light', theme === 'light')
    set({ theme })
  }
}))
```

**Step 4: Create TitleBar component**

`src/renderer/components/layout/TitleBar.tsx`:
```tsx
import { Minus, X, Square, PanelLeftClose, PanelLeft, Moon, Sun } from 'lucide-react'
import { useSettings } from '@/stores/settings'
import { Button } from '@/components/ui/button'

export function TitleBar() {
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useSettings()
  const isMac = navigator.platform.includes('Mac')

  return (
    <div className="drag-region flex items-center h-12 px-4 border-b border-border bg-background shrink-0">
      {/* macOS traffic lights spacing */}
      {isMac && <div className="w-16 shrink-0" />}

      <Button
        variant="ghost"
        size="icon"
        className="no-drag h-7 w-7"
        onClick={toggleSidebar}
      >
        {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>

      <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
        DevForge AI
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="no-drag h-7 w-7"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Windows/Linux window controls */}
      {!isMac && (
        <div className="flex items-center gap-1 ml-2 no-drag">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.api.window.minimize()}>
            <Minus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Square className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => window.api.window.hide()}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
```

**Step 5: Create Sidebar component**

`src/renderer/components/layout/Sidebar.tsx`:
```tsx
import { useSettings } from '@/stores/settings'
import { getTools } from '@/tools/registry'
import { categoryLabels, categoryOrder, type ToolCategory } from '@/tools/types'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function Sidebar() {
  const { activeTool, setActiveTool, sidebarCollapsed } = useSettings()
  const tools = getTools()

  const groupedTools = categoryOrder.reduce((acc, category) => {
    const categoryTools = tools.filter(t => t.category === category)
    if (categoryTools.length > 0) acc.push({ category, tools: categoryTools })
    return acc
  }, [] as { category: ToolCategory; tools: typeof tools }[])

  return (
    <div className={cn(
      'border-r border-border bg-sidebar-background transition-all duration-200 shrink-0',
      sidebarCollapsed ? 'w-14' : 'w-56'
    )}>
      <ScrollArea className="h-full">
        <div className="py-2">
          {groupedTools.map(({ category, tools }) => (
            <div key={category} className="mb-2">
              {!sidebarCollapsed && (
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category]}
                </div>
              )}
              {tools.map((tool) => {
                const Icon = tool.icon
                const isActive = activeTool === tool.id
                return (
                  <TooltipProvider key={tool.id} delayDuration={sidebarCollapsed ? 0 : 1000}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveTool(tool.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors',
                            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                            sidebarCollapsed && 'justify-center px-0'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{tool.name}</span>}
                        </button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right">
                          <p>{tool.name}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
```

**Step 6: Create shared components**

`src/renderer/components/shared/CopyButton.tsx`:
```tsx
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await window.api.clipboard.write(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={className} onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

`src/renderer/components/shared/ToolHeader.tsx`:
```tsx
import { type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ToolHeaderProps {
  icon: LucideIcon
  name: string
  description: string
  aiEnabled?: boolean
}

export function ToolHeader({ icon: Icon, name, description, aiEnabled }: ToolHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{name}</h2>
          {aiEnabled && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">AI</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
```

`src/renderer/components/shared/OutputPanel.tsx`:
```tsx
import { CopyButton } from './CopyButton'

interface OutputPanelProps {
  output: string
  label?: string
}

export function OutputPanel({ output, label = 'Output' }: OutputPanelProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
        {output && <CopyButton text={output} className="h-6 w-6" />}
      </div>
      <div className="flex-1 min-h-0 rounded-lg border border-border bg-card overflow-auto">
        <pre className="p-3 text-sm font-mono whitespace-pre-wrap break-all select-text">
          {output || <span className="text-muted-foreground italic">Output will appear here...</span>}
        </pre>
      </div>
    </div>
  )
}
```

**Step 7: Create ToolShell wrapper**

`src/renderer/components/layout/ToolShell.tsx`:
```tsx
import { Suspense } from 'react'
import { useSettings } from '@/stores/settings'
import { getToolById } from '@/tools/registry'

export function ToolShell() {
  const { activeTool } = useSettings()
  const tool = getToolById(activeTool)

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a tool from the sidebar
      </div>
    )
  }

  const ToolComponent = tool.component

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading tool...
        </div>
      }>
        <ToolComponent />
      </Suspense>
    </div>
  )
}
```

**Step 8: Wire up App.tsx**

`src/renderer/App.tsx`:
```tsx
import { useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToolShell } from '@/components/layout/ToolShell'
import { useSettings } from '@/stores/settings'

// Import tool registrations (side-effect imports)
import './tools/register'

export default function App() {
  const { setActiveTool } = useSettings()

  useEffect(() => {
    const unsub = window.api.onClipboardContent((data) => {
      setActiveTool(data.toolId)
    })
    return unsub
  }, [setActiveTool])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          <ToolShell />
        </main>
      </div>
    </div>
  )
}
```

Create the tool registration entry file (empty for now):

`src/renderer/tools/register.ts`:
```typescript
// Import each tool module here to trigger self-registration.
// Tools are imported in display order within each category.

// Phase 1: Core tools
// (will be populated in Task 5+)
```

**Step 9: Verify layout renders**

```bash
npm run dev
```

Expected: Dark-themed window with title bar, empty collapsible sidebar, and "Select a tool" placeholder in main area.

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: core layout with sidebar, title bar, tool shell, and plugin registry"
```

---

### Task 5: Command Palette (Cmd+K)

**Files:**
- Create: `src/renderer/components/layout/CommandPalette.tsx`
- Create: `src/renderer/hooks/useCommandPalette.ts`
- Modify: `src/renderer/App.tsx` (add command palette)

**Step 1: Install cmdk**

```bash
npm install cmdk
```

**Step 2: Create command palette hook**

`src/renderer/hooks/useCommandPalette.ts`:
```typescript
import { useState, useEffect } from 'react'

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return { open, setOpen }
}
```

**Step 3: Create CommandPalette component**

`src/renderer/components/layout/CommandPalette.tsx`:
```tsx
import { Command } from 'cmdk'
import { getTools } from '@/tools/registry'
import { categoryLabels, categoryOrder } from '@/tools/types'
import { useSettings } from '@/stores/settings'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { setActiveTool } = useSettings()
  const tools = getTools()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <Command
        className="relative w-[560px] rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        loop
      >
        <Command.Input
          placeholder="Search tools..."
          className="w-full px-4 py-3 text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No tools found.
          </Command.Empty>
          {categoryOrder.map(category => {
            const categoryTools = tools.filter(t => t.category === category)
            if (categoryTools.length === 0) return null
            return (
              <Command.Group key={category} heading={categoryLabels[category]}
                className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {categoryTools.map(tool => {
                  const Icon = tool.icon
                  return (
                    <Command.Item
                      key={tool.id}
                      value={`${tool.name} ${tool.keywords.join(' ')}`}
                      onSelect={() => {
                        setActiveTool(tool.id)
                        onOpenChange(false)
                      }}
                      className="flex items-center gap-2.5 px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{tool.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{tool.description}</span>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )
          })}
        </Command.List>
      </Command>
    </div>
  )
}
```

**Step 4: Add to App.tsx**

Add import and render the CommandPalette in App.tsx:
```tsx
import { CommandPalette } from '@/components/layout/CommandPalette'
import { useCommandPalette } from '@/hooks/useCommandPalette'

// Inside App():
const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette()

// In JSX, add before closing </div>:
<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
```

**Step 5: Verify Cmd+K works**

```bash
npm run dev
```

Expected: Pressing Cmd+K (or Ctrl+K) opens a search palette. It shows "No tools found" since none are registered yet.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add command palette with Cmd+K fuzzy search"
```

---

### Task 6: Monaco Editor Wrapper (Lazy-Loaded)

**Files:**
- Create: `src/renderer/components/editor/MonacoWrapper.tsx`

**Step 1: Install Monaco**

```bash
npm install @monaco-editor/react
```

**Step 2: Create lazy-loaded MonacoWrapper**

`src/renderer/components/editor/MonacoWrapper.tsx`:
```tsx
import { useRef, useCallback } from 'react'
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react'
import { useSettings } from '@/stores/settings'

interface MonacoWrapperProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  minimap?: boolean
  height?: string
  className?: string
}

export function MonacoWrapper({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  minimap = false,
  height = '100%',
  className
}: MonacoWrapperProps) {
  const { theme } = useSettings()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
    editor.focus()
  }, [])

  const handleChange: OnChange = useCallback((val) => {
    if (onChange && val !== undefined) onChange(val)
  }, [onChange])

  return (
    <div className={className} style={{ height }}>
      <Editor
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 8, bottom: 8 },
          renderWhitespace: 'selection',
          tabSize: 2,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on'
        }}
        loading={
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading editor...
          </div>
        }
      />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add lazy-loaded Monaco editor wrapper"
```

---

### Task 7: First 4 Deterministic Tools — JSON, Base64, JWT, URL Encode

**Files:**
- Create: `src/renderer/tools/formatters/json-formatter.tsx`
- Create: `src/renderer/tools/encoders/base64.tsx`
- Create: `src/renderer/tools/encoders/jwt-debugger.tsx`
- Create: `src/renderer/tools/encoders/url-encoder.tsx`
- Modify: `src/renderer/tools/register.ts`

**Step 1: JSON Formatter**

`src/renderer/tools/formatters/json-formatter.tsx`:
```tsx
import { lazy } from 'react'
import { Braces } from 'lucide-react'
import { registerTool } from '../registry'
import type { ToolDefinition } from '../types'

const Component = lazy(() => import('./json-formatter-view'))

const tool: ToolDefinition = {
  id: 'json-formatter',
  name: 'JSON Formatter',
  description: 'Format, minify, and validate JSON',
  category: 'formatters',
  icon: Braces,
  keywords: ['json', 'format', 'minify', 'validate', 'pretty', 'print'],
  clipboardPatterns: [{ pattern: /^\s*[\[{][\s\S]*[\]}]\s*$/, priority: 90 }],
  component: Component,
  aiEnabled: true
}

registerTool(tool)
```

`src/renderer/tools/formatters/json-formatter-view.tsx`:
```tsx
import { useState, useCallback, useEffect } from 'react'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { Button } from '@/components/ui/button'
import { Braces } from 'lucide-react'
import { useSettings } from '@/stores/settings'

export default function JsonFormatterView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { activeTool } = useSettings()

  // Auto-load clipboard content
  useEffect(() => {
    window.api.clipboard.read().then(text => {
      const trimmed = text.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        setInput(trimmed)
        formatJson(trimmed, 2)
      }
    })
  }, [activeTool])

  const formatJson = useCallback((text: string, spaces: number) => {
    try {
      const parsed = JSON.parse(text)
      setOutput(JSON.stringify(parsed, null, spaces))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [])

  const handleFormat = () => formatJson(input, 2)
  const handleMinify = () => formatJson(input, 0)

  const handleCopyAndClose = async () => {
    if (output) {
      await window.api.clipboard.write(output)
      window.api.window.hide()
    }
  }

  // Cmd+Enter to copy and close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCopyAndClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="flex flex-col h-full">
      <ToolHeader icon={Braces} name="JSON Formatter" description="Format, minify, and validate JSON" aiEnabled />
      <div className="flex gap-2 mb-3">
        <Button size="sm" onClick={handleFormat}>Format</Button>
        <Button size="sm" variant="secondary" onClick={handleMinify}>Minify</Button>
        <Button size="sm" variant="secondary" onClick={() => { setInput(''); setOutput(''); setError(null) }}>Clear</Button>
        {output && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={handleCopyAndClose}>
            Copy & Close <kbd className="ml-1.5 text-[10px] text-muted-foreground">⌘↵</kbd>
          </Button>
        )}
      </div>
      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-1 gap-3 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase">Input</span>
          </div>
          <div className="flex-1 rounded-lg border border-border overflow-hidden">
            <MonacoWrapper value={input} onChange={setInput} language="json" />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase">Output</span>
            {output && <CopyButton text={output} className="h-5 w-5" />}
          </div>
          <div className="flex-1 rounded-lg border border-border overflow-hidden">
            <MonacoWrapper value={output} language="json" readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Base64 Encoder/Decoder**

`src/renderer/tools/encoders/base64.tsx`:
```tsx
import { lazy } from 'react'
import { Binary } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'base64',
  name: 'Base64 Encode/Decode',
  description: 'Encode or decode Base64 strings',
  category: 'encoders',
  icon: Binary,
  keywords: ['base64', 'encode', 'decode', 'binary'],
  clipboardPatterns: [{ pattern: /^[A-Za-z0-9+/]{20,}={0,2}$/, priority: 70 }],
  component: lazy(() => import('./base64-view'))
})
```

`src/renderer/tools/encoders/base64-view.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { OutputPanel } from '@/components/shared/OutputPanel'
import { Button } from '@/components/ui/button'
import { Binary } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Base64View() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then(text => {
      setInput(text)
      // Auto-detect: if it looks like base64, default to decode
      if (/^[A-Za-z0-9+/]{20,}={0,2}$/.test(text.trim())) {
        setMode('decode')
        try {
          setOutput(atob(text.trim()))
          setError(null)
        } catch { /* ignore */ }
      }
    })
  }, [])

  const process = () => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input.trim()))))
      }
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  useEffect(() => {
    if (input) process()
  }, [input, mode])

  return (
    <div className="flex flex-col h-full">
      <ToolHeader icon={Binary} name="Base64 Encode/Decode" description="Encode or decode Base64 strings" />
      <div className="flex items-center gap-3 mb-3">
        <Tabs value={mode} onValueChange={v => setMode(v as 'encode' | 'decode')}>
          <TabsList>
            <TabsTrigger value="encode">Encode</TabsTrigger>
            <TabsTrigger value="decode">Decode</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" variant="secondary" onClick={() => { setInput(''); setOutput(''); setError(null) }}>Clear</Button>
      </div>
      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
      )}
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <span className="text-xs font-medium text-muted-foreground uppercase mb-1.5">Input</span>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 w-full p-3 rounded-lg border border-border bg-card font-mono text-sm resize-none outline-none focus:ring-1 focus:ring-ring select-text"
            placeholder="Paste text here..."
            spellCheck={false}
          />
        </div>
        <OutputPanel output={output} />
      </div>
    </div>
  )
}
```

**Step 3: JWT Debugger**

`src/renderer/tools/encoders/jwt-debugger.tsx`:
```tsx
import { lazy } from 'react'
import { KeyRound } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'jwt-debugger',
  name: 'JWT Debugger',
  description: 'Decode and inspect JWT tokens',
  category: 'encoders',
  icon: KeyRound,
  keywords: ['jwt', 'token', 'decode', 'json', 'web', 'auth'],
  clipboardPatterns: [{ pattern: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, priority: 100 }],
  component: lazy(() => import('./jwt-debugger-view')),
  aiEnabled: true
})
```

`src/renderer/tools/encoders/jwt-debugger-view.tsx`:
```tsx
import { useState, useEffect, useMemo } from 'react'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { Badge } from '@/components/ui/badge'
import { KeyRound } from 'lucide-react'

function decodeJwtPart(part: string): object | null {
  try {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export default function JwtDebuggerView() {
  const [token, setToken] = useState('')

  useEffect(() => {
    window.api.clipboard.read().then(text => {
      if (/^eyJ[A-Za-z0-9_-]+\.eyJ/.test(text.trim())) {
        setToken(text.trim())
      }
    })
  }, [])

  const decoded = useMemo(() => {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const header = decodeJwtPart(parts[0])
    const payload = decodeJwtPart(parts[1])
    if (!header || !payload) return null

    const exp = (payload as Record<string, unknown>).exp
    const isExpired = typeof exp === 'number' && exp * 1000 < Date.now()

    return { header, payload, signature: parts[2], isExpired }
  }, [token])

  return (
    <div className="flex flex-col h-full">
      <ToolHeader icon={KeyRound} name="JWT Debugger" description="Decode and inspect JWT tokens" aiEnabled />
      <div className="mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase mb-1.5 block">Token</span>
        <textarea
          value={token}
          onChange={e => setToken(e.target.value)}
          className="w-full h-24 p-3 rounded-lg border border-border bg-card font-mono text-sm resize-none outline-none focus:ring-1 focus:ring-ring select-text"
          placeholder="Paste JWT token here..."
          spellCheck={false}
        />
      </div>
      {decoded && (
        <div className="flex flex-col gap-3 flex-1 overflow-auto">
          <div className="flex items-center gap-2">
            {decoded.isExpired
              ? <Badge variant="destructive">Expired</Badge>
              : <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Valid</Badge>
            }
          </div>
          <Section title="Header" data={decoded.header} color="text-blue-400" />
          <Section title="Payload" data={decoded.payload} color="text-purple-400" />
          <div>
            <span className="text-xs font-medium text-red-400 uppercase">Signature</span>
            <pre className="mt-1 p-3 rounded-lg border border-border bg-card font-mono text-xs break-all select-text">
              {decoded.signature}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, data, color }: { title: string; data: object; color: string }) {
  return (
    <div>
      <span className={`text-xs font-medium uppercase ${color}`}>{title}</span>
      <pre className="mt-1 p-3 rounded-lg border border-border bg-card font-mono text-sm select-text">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
```

**Step 4: URL Encoder/Decoder**

`src/renderer/tools/encoders/url-encoder.tsx`:
```tsx
import { lazy } from 'react'
import { Link } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'url-encoder',
  name: 'URL Encode/Decode',
  description: 'Encode or decode URL components',
  category: 'encoders',
  icon: Link,
  keywords: ['url', 'encode', 'decode', 'percent', 'uri'],
  clipboardPatterns: [{ pattern: /^https?:\/\/.+/, priority: 60 }],
  component: lazy(() => import('./url-encoder-view'))
})
```

`src/renderer/tools/encoders/url-encoder-view.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { OutputPanel } from '@/components/shared/OutputPanel'
import { Button } from '@/components/ui/button'
import { Link } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function UrlEncoderView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  useEffect(() => {
    window.api.clipboard.read().then(text => {
      setInput(text)
      if (/%[0-9A-Fa-f]{2}/.test(text)) setMode('decode')
    })
  }, [])

  useEffect(() => {
    try {
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input))
    } catch {
      setOutput(input)
    }
  }, [input, mode])

  return (
    <div className="flex flex-col h-full">
      <ToolHeader icon={Link} name="URL Encode/Decode" description="Encode or decode URL components" />
      <div className="flex items-center gap-3 mb-3">
        <Tabs value={mode} onValueChange={v => setMode(v as 'encode' | 'decode')}>
          <TabsList>
            <TabsTrigger value="encode">Encode</TabsTrigger>
            <TabsTrigger value="decode">Decode</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" variant="secondary" onClick={() => { setInput(''); setOutput('') }}>Clear</Button>
      </div>
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <span className="text-xs font-medium text-muted-foreground uppercase mb-1.5">Input</span>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 w-full p-3 rounded-lg border border-border bg-card font-mono text-sm resize-none outline-none focus:ring-1 focus:ring-ring select-text"
            placeholder="Paste URL or text here..."
            spellCheck={false}
          />
        </div>
        <OutputPanel output={output} />
      </div>
    </div>
  )
}
```

**Step 5: Update register.ts**

```typescript
// Phase 1: Core tools
import './formatters/json-formatter'
import './encoders/base64'
import './encoders/jwt-debugger'
import './encoders/url-encoder'
```

**Step 6: Verify all 4 tools work**

```bash
npm run dev
```

Expected: Sidebar shows 4 tools across Formatters and Encoders categories. Each tool renders with input/output. JSON formatter uses Monaco editor.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add JSON formatter, Base64, JWT debugger, URL encoder tools"
```

---

### Task 8: Remaining Phase 1 Tools — Timestamp, Hash, UUID, Regex

**Files:**
- Create: `src/renderer/tools/converters/unix-timestamp.tsx` + view
- Create: `src/renderer/tools/generators/hash-generator.tsx` + view
- Create: `src/renderer/tools/generators/uuid-generator.tsx` + view
- Create: `src/renderer/tools/inspectors/regex-tester.tsx` + view
- Modify: `src/renderer/tools/register.ts`

**Step 1: Install dependencies**

```bash
npm install uuid bcryptjs
npm install -D @types/uuid @types/bcryptjs
```

**Step 2: Unix Timestamp Converter**

`src/renderer/tools/converters/unix-timestamp.tsx` — registers tool with `Clock` icon.

`src/renderer/tools/converters/unix-timestamp-view.tsx`:
- Two-way conversion: Unix timestamp ↔ human-readable date
- Auto-detects if clipboard contains a 10-13 digit number
- Shows current timestamp with live updating
- Supports seconds and milliseconds

**Step 3: Hash Generator**

`src/renderer/tools/generators/hash-generator.tsx` — registers tool with `Hash` icon.

`src/renderer/tools/generators/hash-generator-view.tsx`:
- Input text → generate MD5, SHA-1, SHA-256, SHA-512 simultaneously
- bcrypt hash with configurable rounds
- Uses Node.js crypto via IPC for SHA hashes, bcryptjs for bcrypt
- Add IPC handler in `src/main/ipc/crypto.ts`

Create `src/main/ipc/crypto.ts`:
```typescript
import { ipcMain } from 'electron'
import { createHash } from 'crypto'

export function registerCryptoHandlers(): void {
  ipcMain.handle('crypto:hash', (_event, algorithm: string, data: string) => {
    return createHash(algorithm).update(data).digest('hex')
  })
}
```

Register in main/index.ts.

**Step 4: UUID Generator**

`src/renderer/tools/generators/uuid-generator.tsx` — registers tool with `Fingerprint` icon.

`src/renderer/tools/generators/uuid-generator-view.tsx`:
- Generate UUID v4 and ULID
- Batch generate (1, 5, 10, 50)
- One-click copy
- Upper/lowercase toggle

**Step 5: Regex Tester**

`src/renderer/tools/inspectors/regex-tester.tsx` — registers tool with `Regex` icon.

`src/renderer/tools/inspectors/regex-tester-view.tsx`:
- Regex input with flags (g, i, m, s, u)
- Test string input
- Real-time match highlighting
- Match groups display
- Uses Monaco for the test string

**Step 6: Update register.ts with all 8 tools**

**Step 7: Verify all 8 tools work**

```bash
npm run dev
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add timestamp, hash, UUID, regex tester — Phase 1 complete"
```

---

## Phase 2: AI Integration

### Task 9: Settings Panel + Secure Key Storage

**Files:**
- Create: `src/main/services/keychain.ts`
- Create: `src/main/ipc/storage.ts`
- Create: `src/renderer/stores/ai-config.ts`
- Create: `src/renderer/components/settings/SettingsDialog.tsx`
- Create: `src/renderer/components/settings/AiProviderSettings.tsx`
- Modify: `src/preload/index.ts` (add storage + AI IPC)

**Step 1: Implement keychain service using safeStorage**

`src/main/services/keychain.ts`:
```typescript
import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store({ name: 'secure-keys' })

export function storeApiKey(provider: string, key: string): void {
  const encrypted = safeStorage.encryptString(key)
  store.set(`apiKey.${provider}`, encrypted.toString('base64'))
}

export function getApiKey(provider: string): string | null {
  const encrypted = store.get(`apiKey.${provider}`) as string | undefined
  if (!encrypted) return null
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
}

export function deleteApiKey(provider: string): void {
  store.delete(`apiKey.${provider}`)
}

export function hasApiKey(provider: string): boolean {
  return store.has(`apiKey.${provider}`)
}
```

**Step 2: Create storage IPC handlers**

**Step 3: Create AI config Zustand store**

**Step 4: Build Settings dialog with tabs for each AI provider**

- General tab: theme, hotkey config
- Ollama tab: endpoint URL, model selection, connection test
- OpenAI tab: API key input (masked), model selection
- Anthropic tab: API key input (masked), model selection
- Google tab: API key input (masked), model selection

**Step 5: Add settings button to TitleBar**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: settings panel with secure API key storage via safeStorage"
```

---

### Task 10: AI Provider Implementations + Router

**Files:**
- Create: `src/main/ai/provider.ts`
- Create: `src/main/ai/ollama.ts`
- Create: `src/main/ai/openai.ts`
- Create: `src/main/ai/anthropic.ts`
- Create: `src/main/ai/google.ts`
- Create: `src/main/ai/router.ts`
- Create: `src/main/ipc/ai.ts`

**Step 1: Install AI SDKs**

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

**Step 2: Define provider interface**

`src/main/ai/provider.ts`:
```typescript
export interface AiOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface AiProvider {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  listModels(): Promise<string[]>
  complete(prompt: string, options?: AiOptions): AsyncGenerator<string, void, unknown>
}
```

**Step 3: Implement Ollama provider** — HTTP client to localhost:11434, streaming via `/api/generate`

**Step 4: Implement OpenAI provider** — Uses `openai` SDK with streaming

**Step 5: Implement Anthropic provider** — Uses `@anthropic-ai/sdk` with streaming

**Step 6: Implement Google provider** — Uses `@google/generative-ai` with streaming

**Step 7: Create AI router** — Checks Ollama availability first, then falls back to user-configured cloud provider. Returns which provider was used (for privacy badge).

**Step 8: Create AI IPC handler** — Bridges main process AI router to renderer via streaming IPC events

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: AI provider implementations — Ollama, OpenAI, Anthropic, Google with router"
```

---

### Task 11: AI UI Components — Privacy Badge, Streaming Output, Action Bar

**Files:**
- Create: `src/renderer/components/ai/PrivacyBadge.tsx`
- Create: `src/renderer/components/ai/StreamingOutput.tsx`
- Create: `src/renderer/components/ai/AiActionBar.tsx`
- Create: `src/renderer/hooks/useAi.ts`

**Step 1: Create useAi hook** — Handles IPC streaming, loading state, provider tracking

**Step 2: Create PrivacyBadge** — Green shield = local, Yellow cloud = cloud, with tooltip

**Step 3: Create StreamingOutput** — Token-by-token rendering with cursor animation

**Step 4: Create AiActionBar** — "Magic Fix", "Explain", "Generate Types" buttons that appear on AI-enabled tools

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: AI UI components — privacy badge, streaming output, action bar"
```

---

### Task 12: AI Feature — Magic Fix + Explain This

**Step 1: Add "Magic Fix" button to JSON Formatter** — On parse error, shows sparkle button that sends malformed JSON to AI with prompt "Fix this malformed JSON, return only the corrected JSON"

**Step 2: Add AI Regex Explainer** — Button on regex tester that explains the regex step-by-step

**Step 3: Add AI Cron Explainer** (on cron parser tool, built in Task 15)

**Step 4: Add AI Log Analyzer tool** — `src/renderer/tools/ai/log-analyzer.tsx`

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: AI Magic Fix for JSON + Regex Explainer + Log Analyzer"
```

---

### Task 13: AI Feature — Type Generator + Magic Transform + Mock Data

**Files:**
- Create: `src/renderer/tools/ai/code-generator.tsx` + view
- Create: `src/renderer/tools/ai/magic-transform.tsx` + view
- Create: `src/renderer/tools/generators/mock-data-generator.tsx` + view

**Step 1: Code/Type Generator** — Paste JSON, select target language (TypeScript, Go, Rust, Python), AI generates typed structures

**Step 2: Magic Transform (NL Data Transformer)** — Split-pane: left = input data, right = prompt input + output. Streaming AI response.

**Step 3: Mock Data Generator** — Prompt-driven: "Generate 50 users with European names and UK phone numbers as JSON array"

**Step 4: Update register.ts with AI tools**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: AI type generator, magic transform, mock data generator"
```

---

## Phase 3: Full Suite & Polish

### Task 14: Remaining Formatters — XML, HTML, CSS, JS, SQL, YAML

**Files:**
- Create views for each formatter in `src/renderer/tools/formatters/`

**Step 1: Install formatting libraries**

```bash
npm install prettier js-yaml sql-formatter
npm install -D @types/js-yaml
```

**Step 2: Implement each formatter** — All follow the same pattern as JSON formatter (input/output split pane with Monaco). Use:
- Prettier for HTML, CSS, JS
- sql-formatter for SQL
- js-yaml for YAML
- DOMParser for XML (built-in)

**Step 3: Register all formatters**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add XML, HTML, CSS, JS, SQL, YAML formatters"
```

---

### Task 15: Remaining Encoders, Converters, Inspectors

**Files:**
- Create: `src/renderer/tools/encoders/html-entities.tsx` + view
- Create: `src/renderer/tools/encoders/hex-ascii.tsx` + view
- Create: `src/renderer/tools/converters/json-yaml.tsx` + view
- Create: `src/renderer/tools/converters/json-csv.tsx` + view
- Create: `src/renderer/tools/converters/number-base.tsx` + view
- Create: `src/renderer/tools/converters/text-case.tsx` + view
- Create: `src/renderer/tools/inspectors/diff-checker.tsx` + view
- Create: `src/renderer/tools/inspectors/cron-parser.tsx` + view
- Create: `src/renderer/tools/inspectors/text-inspector.tsx` + view
- Create: `src/renderer/tools/generators/password-generator.tsx` + view

**Step 1: Install remaining dependencies**

```bash
npm install csv-parse csv-stringify cron-parser diff
npm install -D @types/diff
```

**Step 2: Implement each tool** — Standard input/output pattern

**Step 3: Register all tools**

**Step 4: Verify complete suite — 20+ tools all showing in sidebar**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete tool suite — all encoders, converters, inspectors, generators"
```

---

### Task 16: Multi-Window Pop-Out Support

**Files:**
- Modify: `src/main/index.ts` (add popout window creation IPC)
- Modify: `src/preload/index.ts` (add popout API)
- Create: `src/renderer/components/shared/PopOutButton.tsx`
- Modify: `src/renderer/components/shared/ToolHeader.tsx`

**Step 1: Add IPC handler to create child BrowserWindow** — Always-on-top, smaller default size, loads same renderer with query param for tool ID

**Step 2: Add PopOutButton to ToolHeader**

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: multi-window pop-out support for individual tools"
```

---

### Task 17: Auto-Updater + Packaging Configuration

**Files:**
- Create: `electron-builder.yml`
- Modify: `package.json` (build scripts)
- Modify: `src/main/services/updater.ts`

**Step 1: Install electron-builder**

```bash
npm install -D electron-builder
```

**Step 2: Configure electron-builder.yml** — .dmg for macOS, .exe (NSIS) for Windows, .AppImage for Linux

**Step 3: Implement auto-updater service** — Check for updates on app start, notify user, download in background

**Step 4: Add build scripts to package.json**

```json
{
  "scripts": {
    "build:mac": "electron-vite build && electron-builder --mac",
    "build:win": "electron-vite build && electron-builder --win",
    "build:linux": "electron-vite build && electron-builder --linux"
  }
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: auto-updater + cross-platform packaging configuration"
```

---

### Task 18: Final Polish + Performance Optimization

**Step 1: Audit lazy-loading** — Ensure Monaco and AI SDKs are only loaded when needed

**Step 2: Add history store** — Track recently used tools, show in command palette

**Step 3: Add keyboard shortcuts** — Cmd+Enter (copy output + hide), Escape (close/minimize), tab navigation between tools

**Step 4: Test clipboard detection accuracy** — Verify >90% correct detection with sample data

**Step 5: Performance test** — Verify idle RAM < 150MB, wake time < 100ms

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: performance optimization, history, keyboard shortcuts — Phase 3 complete"
```
