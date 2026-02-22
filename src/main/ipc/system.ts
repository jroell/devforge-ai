import { BrowserWindow, ipcMain } from 'electron'

export function registerSystemHandlers(): void {
  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on('window:hide', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.hide()
  })
}
