# DevForge AI - Design Document

**Date:** 2026-02-22
**Status:** Approved
**Platform:** Desktop (macOS, Windows, Linux) via Electron

---

## Overview

DevForge AI is a lightning-fast, offline-first desktop toolbox for developers. It provides 20+ deterministic developer utilities (formatters, encoders, converters, generators, inspectors) accessible instantly via a global keyboard shortcut, enhanced with context-aware AI features (Magic Fix, Explain This, Type Generator, Natural Language Transformer, Mock Data Generator).

## Key Design Decisions

### Build Toolchain
- **electron-vite**: Purpose-built for Electron + Vite. Handles main/preload/renderer processes with a unified config.

### Process Architecture
- **Context Bridge + IPC**: Main process handles all Node.js operations (clipboard, crypto, AI API calls). Renderer gets a typed `window.api` bridge via `contextBridge.exposeInMainWorld`. No `nodeIntegration` in renderer.

### Tool Architecture
- **Plugin Registry Pattern**: Each tool is a self-contained module exporting a `ToolDefinition` with metadata (name, icon, category, clipboardDetector regex, lazy-loaded component). New tools are added by dropping a file in `src/renderer/tools/` and registering it.

### AI Providers
- **Tier 1 (Local):** Ollama integration (polls localhost:11434)
- **Tier 2 (Cloud):** OpenAI, Anthropic, Google Gemini — all BYOK (Bring Your Own Key)
- API keys stored via Electron `safeStorage` API (OS native keychain)
- Privacy Badge: Green = Local, Yellow = Cloud

### State Management
- **Zustand** for lightweight reactive state (settings, AI config, history)
- **electron-store** for persistent local storage of preferences

---

## Architecture

### Project Structure

```
devforge-ai/
├── electron.vite.config.ts
├── package.json
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── index.ts             # App lifecycle, window, tray
│   │   ├── ipc/                 # IPC handlers (clipboard, ai, crypto, storage, system)
│   │   ├── ai/                  # AI provider implementations
│   │   │   ├── provider.ts      # Abstract interface
│   │   │   ├── ollama.ts
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   └── google.ts
│   │   ├── services/
│   │   │   ├── clipboard-detector.ts
│   │   │   ├── keychain.ts
│   │   │   └── updater.ts
│   │   └── tray.ts
│   ├── preload/
│   │   ├── index.ts             # contextBridge exposure
│   │   └── types.ts             # Typed window.api surface
│   └── renderer/                # React Frontend
│       ├── App.tsx
│       ├── components/
│       │   ├── layout/          # Sidebar, CommandPalette, TitleBar, ToolShell
│       │   ├── editor/          # MonacoWrapper (lazy-loaded)
│       │   ├── ai/              # AiActionBar, PrivacyBadge, StreamingOutput, MagicPrompt
│       │   └── shared/          # CopyButton, ToolHeader, OutputPanel
│       ├── tools/               # Plugin registry
│       │   ├── registry.ts
│       │   ├── types.ts
│       │   ├── formatters/      # JSON, XML, HTML, CSS, JS, SQL, YAML
│       │   ├── encoders/        # Base64, URL, HTML Entities, Hex, JWT
│       │   ├── converters/      # Timestamp, JSON↔YAML, JSON↔CSV, Number Base, Text Case
│       │   ├── generators/      # UUID, Hash, Password, Mock Data (AI)
│       │   ├── inspectors/      # Regex, Diff, Cron, Text Inspector
│       │   └── ai/              # Magic Transform, Code Generator, Log Analyzer
│       ├── hooks/               # useClipboard, useAi, useTool, useCommandPalette
│       ├── stores/              # Zustand stores (settings, ai-config, history)
│       ├── lib/                 # Pure utility functions
│       └── styles/
```

### Data Flow

```
User copies text → Global Hotkey → Main reads clipboard via IPC
→ clipboard-detector runs regex patterns from tool registry
→ Renderer receives detected tool ID + content
→ Router navigates to tool, auto-populates input
→ User processes or clicks AI action
→ AI: Main routes to Ollama or Cloud provider (streaming)
→ Cmd+Enter: output → clipboard, window minimizes
```

### AI Provider Interface

```typescript
interface AiProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  complete(prompt: string, options: AiOptions): AsyncGenerator<string>;
}
```

All providers implement streaming via async generators. The AI router checks:
1. Is Ollama running locally? → Route to Ollama
2. User preference for cloud provider → Route to selected cloud provider

### Clipboard Detection Priority

JWT → JSON → XML → HTML → Base64 → Unix Timestamp → URL → fallback to last-used tool

More specific patterns run first to avoid false positives (e.g., JWT is valid Base64 but should match JWT first).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron + electron-vite |
| Frontend | React 19 + TypeScript + Vite |
| Styling | TailwindCSS v4 + shadcn/ui |
| Code Editor | Monaco Editor (lazy-loaded) |
| State | Zustand |
| Storage | electron-store |
| Command Palette | cmdk |
| AI (Local) | Ollama HTTP API |
| AI (Cloud) | OpenAI SDK, Anthropic SDK, Google Generative AI SDK |
| Formatting | Prettier (HTML/CSS/JS), sql-formatter, js-yaml |
| Crypto | bcryptjs (pure JS), Node.js crypto |
| Diff | diff library |
| CSV | csv-parse + csv-stringify |
| Cron | cron-parser |
| Updates | electron-updater |

---

## UI Design

- Dark-first theme with light mode toggle
- Frameless window with custom title bar (macOS), standard frame fallback (Windows/Linux)
- Fixed collapsible sidebar with tool categories
- Monaco Editor lazy-loaded only for tools that need it
- Idle RAM target: < 150MB (aggressive lazy-loading)
- App wake-to-render target: < 100ms

---

## Phased Delivery

### Phase 1: MVP Core
- Electron shell with global hotkey, system tray, clipboard detection
- Core UI: sidebar, command palette (Cmd+K), tool shell with Monaco
- Top 8 tools: JSON Formatter, Base64, JWT Debugger, URL Encode, Unix Timestamp, Hash Generator, UUID, Regex Tester

### Phase 2: AI Integration
- Settings panel with API key management + Ollama config
- AI provider router with streaming
- Magic Fix, Explain This, Type Generator, NL Transformer, Mock Data Generator
- Privacy Badge on all AI-enabled tools

### Phase 3: Full Suite & Polish
- Remaining tools: Diff Checker, Text Case, YAML/SQL/XML/HTML/CSS/JS formatters, all converters
- Multi-window pop-out support
- Auto-updater
- Cross-platform packaging (.dmg, .exe, .AppImage)
