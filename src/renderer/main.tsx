import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Dev-only: provide a stub window.api when running outside Electron (e.g. browser preview)
if (!window.api) {
  const noop = () => {}
  const noopAsync = () => Promise.resolve()
  const noopUnsub = () => () => {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).api = {
    clipboard: {
      read: () => Promise.resolve(''),
      write: noopAsync,
      detectType: () => Promise.resolve({ toolId: 'json-formatter', content: '', confidence: 0 })
    },
    crypto: { hash: () => Promise.resolve('') },
    window: { minimize: noop, hide: noop, popout: noopAsync },
    onClipboardContent: noopUnsub,
    keychain: { store: noopAsync, get: () => Promise.resolve(null), delete: noopAsync, has: () => Promise.resolve(false) },
    settings: { get: (_k: string, d?: unknown) => Promise.resolve(d ?? null), set: noopAsync },
    ai: {
      complete: () => Promise.resolve({ provider: 'mock', isLocal: true }),
      checkOllama: () => Promise.resolve(false),
      listModels: () => Promise.resolve([]),
      onStreamChunk: noopUnsub,
      onStreamEnd: noopUnsub,
      onStreamError: noopUnsub
    },
    updater: {
      check: () => Promise.resolve(null),
      download: noopAsync,
      install: noopAsync,
      onChecking: noopUnsub,
      onAvailable: noopUnsub,
      onNotAvailable: noopUnsub,
      onProgress: noopUnsub,
      onDownloaded: noopUnsub,
      onError: noopUnsub
    },
    customTools: {
      list: () => Promise.resolve([]),
      get: () => Promise.resolve({}),
      save: (c: unknown) => Promise.resolve(c),
      delete: noopAsync
    },
    license: {
      fingerprint: () => Promise.resolve('dev-fingerprint-mock'),
      activate: () => Promise.resolve({ status: 'trial' as const, machineId: 'dev', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), timestamp: Date.now(), signature: 'mock' }),
      validate: () => Promise.resolve({ status: 'trial' as const, machineId: 'dev', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), timestamp: Date.now(), signature: 'mock' }),
      check: () => Promise.resolve({ status: 'licensed' as const, expiresAt: null, daysRemaining: null, lastValidated: Date.now() }),
      cached: () => Promise.resolve({ status: 'licensed' as const, expiresAt: null, daysRemaining: null, lastValidated: Date.now() }),
      upgrade: () => Promise.resolve('https://example.com'),
      onStatusUpdate: noopUnsub,
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
