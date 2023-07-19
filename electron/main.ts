import { app, BrowserWindow, Menu, ipcMain, systemPreferences } from 'electron'
import path from 'node:path'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  ipcMain.on('getMediaAccessStatus', async () => {
    //检测麦克风权限是否开启
    let getMediaAccessStatus =
      systemPreferences.getMediaAccessStatus('microphone')
    if (getMediaAccessStatus !== 'granted') {
      //请求麦克风权限
      await systemPreferences.askForMediaAccess('microphone')
    }
  })
  Menu.setApplicationMenu(null)
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  // win.webContents.openDevTools()
  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  win = null
  app.quit()
})
// app.on('ready', () => {
//   // 注册全局快捷键
//   globalShortcut.register('CommandOrControl+Shift+I', () => {
//     win?.webContents.openDevTools()
//   })
// })
app.whenReady().then(createWindow)
