import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerClipboardHandlers } from './ipc/clipboard'
import { registerCryptoHandlers } from './ipc/crypto'
import { registerSystemHandlers } from './ipc/system'
import { registerStorageHandlers } from './ipc/storage'
import { registerAiHandlers } from './ipc/ai'
import { createTray } from './tray'
import { detectClipboardType } from './services/clipboard-detector'
import { registerUpdaterHandlers } from './ipc/updater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    ...(process.platform === 'darwin'
      ? { trafficLightPosition: { x: 15, y: 10 } }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
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

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.show()
  mainWindow.focus()

  const text = clipboard.readText()
  if (text) {
    const detection = detectClipboardType(text)
    mainWindow.webContents.send('clipboard:content', {
      toolId: detection.toolId,
      content: detection.content
    })
  }
}

app.whenReady().then(() => {
  registerClipboardHandlers()
  registerCryptoHandlers()
  registerSystemHandlers()
  registerStorageHandlers()
  registerAiHandlers()

  ipcMain.handle('window:popout', (_event, toolId: string) => {
    const child = new BrowserWindow({
      width: 700,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      alwaysOnTop: true,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      ...(process.platform === 'darwin'
        ? { trafficLightPosition: { x: 15, y: 10 } }
        : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      child.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?tool=${toolId}`)
    } else {
      child.loadFile(join(__dirname, '../renderer/index.html'), {
        query: { tool: toolId }
      })
    }
  })

  createWindow()

  if (mainWindow) {
    registerUpdaterHandlers(mainWindow)
    // Check for updates 5 seconds after launch (don't block startup)
    setTimeout(() => {
      mainWindow?.webContents.send('updater:checking')
      // Only check in production
      if (!is.dev) {
        import('./services/updater').then(({ checkForUpdates }) => {
          checkForUpdates().catch(() => {
            // Silently ignore update check failures
          })
        })
      }
    }, 5000)
  }

  createTray(showAndFocus)

  globalShortcut.register('Alt+Space', showAndFocus)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      showAndFocus()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
