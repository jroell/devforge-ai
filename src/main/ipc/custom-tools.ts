import { app, ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'

function getCustomToolsDir(): string {
  return join(app.getPath('userData'), 'custom-tools')
}

async function ensureDir(): Promise<void> {
  const dir = getCustomToolsDir()
  await fs.mkdir(dir, { recursive: true })
}

export function registerCustomToolHandlers(): void {
  ipcMain.handle('custom-tools:list', async () => {
    const dir = getCustomToolsDir()
    try {
      await ensureDir()
      const files = await fs.readdir(dir)
      const configs = await Promise.all(
        files
          .filter((f) => f.endsWith('.json'))
          .map(async (f) => {
            const raw = await fs.readFile(join(dir, f), 'utf-8')
            return JSON.parse(raw)
          })
      )
      return configs
    } catch {
      return []
    }
  })

  ipcMain.handle('custom-tools:get', async (_e, id: string) => {
    const filePath = join(getCustomToolsDir(), `${id}.json`)
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  })

  ipcMain.handle('custom-tools:save', async (_e, config: Record<string, unknown>) => {
    await ensureDir()
    const id = config.id as string
    const filePath = join(getCustomToolsDir(), `${id}.json`)
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8')
    return config
  })

  ipcMain.handle('custom-tools:delete', async (_e, id: string) => {
    const filePath = join(getCustomToolsDir(), `${id}.json`)
    await fs.unlink(filePath)
  })
}
