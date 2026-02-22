import { app, Menu, Tray } from 'electron'
import { join } from 'path'

export function createTray(showWindow: () => void): Tray {
  const iconPath = join(__dirname, '../../resources/trayIconTemplate.png')
  const tray = new Tray(iconPath)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show DevForge AI', click: showWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setToolTip('DevForge AI')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    showWindow()
  })

  return tray
}
