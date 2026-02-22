import { clipboard, ipcMain } from 'electron'
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
