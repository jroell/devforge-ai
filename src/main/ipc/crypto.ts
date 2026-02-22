import { ipcMain } from 'electron'
import { createHash } from 'crypto'

export function registerCryptoHandlers(): void {
  ipcMain.handle('crypto:hash', (_event, algorithm: string, data: string) => {
    return createHash(algorithm).update(data, 'utf8').digest('hex')
  })
}
