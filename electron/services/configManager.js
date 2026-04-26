const StoreModule = require('electron-store');
const fs = require('fs');
const path = require('path');

const Store = StoreModule.default || StoreModule;
const store = new Store();

function getConfig() {
  const defaultMapping = {
      'Box - 3D': 'cover3d',
      'Box - Front': 'cover2d',
      'Box - Front - Reconstructed': 'cover2d',
      'Screenshot - Gameplay': 'screenshot',
      'Screenshot - Game Title': 'titlescreen',
      'Clear Logo': 'wheel',
      'Fanart - Background': 'fanart',
      'Cart - 3D': 'cartridge',
      'Cart - Front': 'cartridge'
  };

  const config = store.get('config', {
    retrobatPath: '',
    mediaMapping: defaultMapping,
    enabledMediaTypes: {
      cover3d: true,
      cover2d: true,
      screenshot: true,
      titlescreen: true,
      wheel: true,
      fanart: true,
      cartridge: true,
      video: true
    },
    customFolderNames: {
      cover3d: '',
      cover2d: '',
      screenshot: '',
      titlescreen: '',
      wheel: '',
      fanart: '',
      cartridge: '',
      video: ''
    },
    devMode: {
      mediaTestsPath: true
    },
    verboseLog: true,
    overwriteExisting: false,
    preferredRegions: ['North America', 'United States', 'Europe', 'World'],
    videoDuration: 20
  });

  // Se o mapeamento for o antigo, atualizamos para o novo
  if (config.mediaMapping && (config.mediaMapping['COVER - 3D'] || config.mediaMapping['Box - 3D'] === 'box3d')) {
      config.mediaMapping = defaultMapping;
      // Migra enabledMediaTypes e customFolderNames antigos
      if (config.enabledMediaTypes?.box3d !== undefined) {
          config.enabledMediaTypes.cover3d = config.enabledMediaTypes.box3d;
          delete config.enabledMediaTypes.box3d;
      }
      if (config.enabledMediaTypes?.cover !== undefined) {
          config.enabledMediaTypes.cover2d = config.enabledMediaTypes.cover;
          delete config.enabledMediaTypes.cover;
      }
      if (config.customFolderNames?.box3d !== undefined) {
          config.customFolderNames.cover3d = config.customFolderNames.box3d;
          delete config.customFolderNames.box3d;
      }
      if (config.customFolderNames?.cover !== undefined) {
          config.customFolderNames.cover2d = config.customFolderNames.cover;
          delete config.customFolderNames.cover;
      }
      store.set('config', config);
  }

  // Garante que os campos de vídeo existam em configs antigas
  if (config.enabledMediaTypes && config.enabledMediaTypes.video === undefined) {
      config.enabledMediaTypes.video = true;
      config.customFolderNames.video = '';
      config.videoDuration = 20;
      store.set('config', config);
  }
  if (config.videoDuration === undefined) {
      config.videoDuration = 20;
      store.set('config', config);
  }

  return config;
}

function saveConfig(newConfig) {
  store.set('config', newConfig);
  return { success: true };
}

function getRetrobatPath() {
  return store.get('config.retrobatPath', '');
}

// Verifica se a estrutura base do retrobat é válida
function validateRetrobatPath(retrobatPath) {
  if (!retrobatPath) return { valid: false, error: 'Caminho não fornecido.' };

  const romsDir = path.join(retrobatPath, 'roms');
  const esDir = path.join(retrobatPath, 'emulationstation', '.emulationstation');

  if (!fs.existsSync(romsDir)) {
    return { valid: false, error: `Pasta 'roms' não encontrada em: ${romsDir}` };
  }

  if (!fs.existsSync(esDir)) {
    return { valid: false, error: `Pasta '.emulationstation' não encontrada em: ${esDir}` };
  }

  return { valid: true };
}

module.exports = {
  getConfig,
  saveConfig,
  getRetrobatPath,
  validateRetrobatPath
};
