import { ipcMain } from 'electron'
import Store from 'electron-store'
import { storeApiKey, getApiKey, deleteApiKey, hasApiKey } from '../services/keychain'

const settingsStore = new Store({ name: 'settings' })

export function registerStorageHandlers(): void {
  // API key management
  ipcMain.handle('keychain:store', (_e, provider: string, key: string) => {
    storeApiKey(provider, key)
  })
  ipcMain.handle('keychain:get', (_e, provider: string) => {
    return getApiKey(provider)
  })
  ipcMain.handle('keychain:delete', (_e, provider: string) => {
    deleteApiKey(provider)
  })
  ipcMain.handle('keychain:has', (_e, provider: string) => {
    return hasApiKey(provider)
  })

  // General settings
  ipcMain.handle('settings:get', (_e, key: string, defaultValue?: unknown) => {
    return settingsStore.get(key, defaultValue)
  })
  ipcMain.handle('settings:set', (_e, key: string, value: unknown) => {
    settingsStore.set(key, value)
  })
}
