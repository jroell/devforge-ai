import { ipcMain, BrowserWindow } from 'electron'
import { checkForUpdates, downloadUpdate, installUpdate, setupAutoUpdater } from '../services/updater'

export function registerUpdaterHandlers(mainWindow: BrowserWindow): void {
  setupAutoUpdater(mainWindow)

  ipcMain.handle('updater:check', async () => {
    try {
      const result = await checkForUpdates()
      return result?.updateInfo?.version ?? null
    } catch {
      return null
    }
  })

  ipcMain.handle('updater:download', () => {
    downloadUpdate()
  })

  ipcMain.handle('updater:install', () => {
    installUpdate()
  })
}
