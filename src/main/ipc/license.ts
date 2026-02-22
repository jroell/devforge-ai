import { BrowserWindow, ipcMain, shell } from 'electron'
import {
  activateTrial,
  validateLicense,
  checkLicense,
  getCheckoutUrl,
  getCachedLicenseState
} from '../services/license-client'
import { getMachineFingerprint } from '../services/fingerprint'

export function registerLicenseHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('license:fingerprint', () => {
    return getMachineFingerprint()
  })

  ipcMain.handle('license:activate', async () => {
    return activateTrial()
  })

  ipcMain.handle('license:validate', async () => {
    return validateLicense()
  })

  ipcMain.handle('license:check', async () => {
    return checkLicense()
  })

  ipcMain.handle('license:cached', () => {
    return getCachedLicenseState()
  })

  ipcMain.handle('license:upgrade', async () => {
    const url = await getCheckoutUrl()
    shell.openExternal(url)
    return url
  })

  // Periodic validation: every 4 hours
  setInterval(async () => {
    try {
      const state = await checkLicense()
      mainWindow.webContents.send('license:status-update', state)
    } catch {
      // Silent failure — cached state still valid
    }
  }, 4 * 60 * 60 * 1000)
}
