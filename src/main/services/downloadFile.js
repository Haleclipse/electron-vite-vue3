import { app, ipcMain, BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import { arch, platform } from 'os'
import { stat, remove } from 'fs-extra'
import packageInfo from '../../../package.json'


/**
 *
 * @description
 * @returns {void} 下载类
 * @param {mainWindow} 主窗口
 * @param {downloadUrl} 下载地址，当未传入时则会使用预先设置好的baseUrl拼接名称
 * @author Sky
 * @date 2020-08-12
 */

class Main {

  mainWindow = null
  downloadUrl = ""
  version = packageInfo.version
  baseUrl = ''
  Sysarch = arch().includes('64') ? 'win64' : 'win32'
  HistoryFilePath = join(app.getPath('downloads'), platform().includes('win32') ? `electron_${this.version}_${this.Sysarch}.exe` : `electron_${this.version}_mac.dmg`)


  constructor(mainWindow, downloadUrl) {
    this.mainWindow = mainWindow
    this.downloadUrl = downloadUrl || platform().includes('win32') ? this.baseUrl + `electron_${this.version}_${this.Sysarch}.exe?${new Date().getTime()}` : this.baseUrl + `electron_${this.version}_mac.dmg?${new Date().getTime()}`
  }

  start() {
    ipcMain.on('satrt-download', (event, msg) => {
      // 更新时检查有无同名文件，若有就删除，若无就开始下载
      stat(this.HistoryFilePath, async (err, stats) => {
        try {
          if (stats) {
            await remove(this.HistoryFilePath)
          }
          this.mainWindow.webContents.downloadURL(msg.downloadUrl || this.downloadUrl)
        } catch (error) { console.log(error) }
      })
      this.mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        const filePath = join(app.getPath('downloads'), item.getFilename())
        item.setSavePath(filePath)
        item.on('updated', (event, state) => {
          switch (state) {
            case 'progressing':
              this.mainWindow.webContents.send('download-progress', (item.getReceivedBytes() / item.getTotalBytes() * 100).toFixed(0))
              break
            default:
              this.mainWindow.webContents.send('download-error', true)
              dialog.showErrorBox('下载出错', '由于网络或其他未知原因导致客户端下载出错，请前往官网进行重新安装')
              break
          }
        })
        item.once('done', (event, state) => {
          switch (state) {
            case 'completed':
              const data = {
                filePath
              }
              this.mainWindow.webContents.send('download-done', data)
              break
            case 'interrupted':
              this.mainWindow.webContents.send('download-error', true)
              dialog.showErrorBox('下载出错', '由于网络或其他未知原因导致客户端下载出错，请前往官网进行重新安装')
              break
            default:
              break
          }
        })
      })
    })
  }
}

export default Main
