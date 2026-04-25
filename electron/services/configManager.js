const StoreModule = require('electron-store');
const fs = require('fs');
const path = require('path');

const Store = StoreModule.default || StoreModule;
const store = new Store();

function getConfig() {
  const defaultMapping = {
      'Box - 3D': 'box3d',
      'Box - Front': 'cover',
      'Box - Front - Reconstructed': 'cover',
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
      box3d: true,
      cover: true,
      screenshot: true,
      titlescreen: true,
      wheel: true,
      fanart: true,
      cartridge: true
    },
    customFolderNames: {
      box3d: '',
      cover: '',
      screenshot: '',
      titlescreen: '',
      wheel: '',
      fanart: '',
      cartridge: ''
    },
    devMode: {
      mediaTestsPath: true
    },
    verboseLog: true,
    overwriteExisting: false,
    preferredRegions: ['North America', 'United States', 'Europe', 'World']
  });

  // Se o mapeamento for o antigo, atualizamos para o novo
  if (config.mediaMapping && config.mediaMapping['COVER - 3D']) {
      config.mediaMapping = defaultMapping;
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
