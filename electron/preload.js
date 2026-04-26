const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  validateRetrobatPath: (path) => ipcRenderer.invoke('validate-retrobat-path', path),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  getSystems: () => ipcRenderer.invoke('get-systems'),
  getGamesFromFolder: (systemName) => ipcRenderer.invoke('get-games-from-folder', systemName),
  launchboxGetGames: (system) => ipcRenderer.invoke('launchbox-get-games', system),
  launchboxScrapeGame: (url) => ipcRenderer.invoke('launchbox-scrape-game', url),
  launchboxSearchGame: (params) => ipcRenderer.invoke('launchbox-search-game', params),
  downloadMedia: (data) => ipcRenderer.invoke('download-media', data),
  checkMediaExists: (data) => ipcRenderer.invoke('check-media-exists', data),

  // Banco Local
  dbSearchGame: (params) => ipcRenderer.invoke('db-search-game', params),
  dbGetImages: (databaseId) => ipcRenderer.invoke('db-get-images', databaseId),
  dbGetPlatforms: () => ipcRenderer.invoke('db-get-platforms'),

  // Video Downloader
  downloadVideo: (params) => ipcRenderer.invoke('download-video', params),
  ensureYtDlp: () => ipcRenderer.invoke('ensure-ytdlp')
});
