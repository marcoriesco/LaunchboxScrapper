const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Só importamos isDev depois que foi instalado, o fallback evita quebrar se algo der erro
let isDev = false;
try {
  isDev = require('electron-is-dev');
} catch (e) {
  isDev = process.env.NODE_ENV === 'development';
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove menu padrão para visual mais clean
  win.setMenuBarVisibility(false);

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // Em produção, vai rodar os arquivos estáticos exportados do Next.js
    win.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Registra os IPC handlers
const configManager = require('./services/configManager');

const esParser = require('./services/esParser');
const romManager = require('./services/romManager');
const scraper = require('./services/scraper');
const mediaDownloader = require('./services/mediaDownloader');
const localDb = require('./services/localDb');
const videoDownloader = require('./services/videoDownloader');

ipcMain.handle('ping', () => 'pong');

ipcMain.handle('get-config', () => {
  return configManager.getConfig();
});

ipcMain.handle('save-config', (event, newConfig) => {
  return configManager.saveConfig(newConfig);
});

ipcMain.handle('validate-retrobat-path', (event, pathToCheck) => {
  return configManager.validateRetrobatPath(pathToCheck);
});

// Novos Handlers
const { dialog } = require('electron');

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-systems', () => {
  return esParser.getSystems();
});

ipcMain.handle('get-games-from-folder', (event, systemName) => {
  return romManager.getGamesFromFolder(systemName);
});

ipcMain.handle('launchbox-get-games', async (event, system) => {
  try {
    return await scraper.getGamesFromSystem(system);
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('launchbox-scrape-game', async (event, url) => {
  try {
    return await scraper.scrapeGameDetails(url);
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('launchbox-search-game', async (event, { query, platformName }) => {
  try {
    return await scraper.searchGame(query, platformName);
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('download-media', async (event, { systemName, gameFileName, mediaImages, videoUrl }) => {
  return await mediaDownloader.downloadMedia(systemName, gameFileName, mediaImages, videoUrl);
});

ipcMain.handle('check-media-exists', (event, { systemName, gameFileName }) => {
  return mediaDownloader.checkMediaExists(systemName, gameFileName);
});

// === Banco de Dados Local ===
ipcMain.handle('db-search-game', (event, { query, platformName }) => {
  try {
    return localDb.searchGame(query, platformName);
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('db-get-images', (event, databaseId) => {
  try {
    return localDb.getGameImages(databaseId);
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('db-get-platforms', () => {
  try {
    return localDb.getPlatforms();
  } catch (e) {
    return { error: e.message };
  }
});

// Video Downloader
ipcMain.handle('download-video', async (event, params) => {
  return await videoDownloader.downloadVideo(params.videoUrl, params.outputPath, params.duration);
});

ipcMain.handle('ensure-ytdlp', async () => {
  return await videoDownloader.ensureYtDlp();
});
