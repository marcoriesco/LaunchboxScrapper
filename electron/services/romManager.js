const fs = require('fs');
const path = require('path');
const configManager = require('./configManager');
const esParser = require('./esParser');

function getGamesFromFolder(systemName) {
    const retrobatPath = configManager.getRetrobatPath();
    if (!retrobatPath) return { error: 'Caminho do Retrobat não configurado.' };

    const systems = esParser.getSystems();
    if (systems.error) return systems;

    const system = systems.find(s => s.name === systemName);
    if (!system) return { error: 'Sistema não encontrado no es_systems.cfg' };

    const romFolder = path.join(retrobatPath, 'roms', systemName);
    if (!fs.existsSync(romFolder)) return { error: 'Pasta de ROMs não encontrada: ' + romFolder };

    // system.extension format is usually ".nes .zip .7z"
    const extensions = system.extension ? system.extension.split(' ').map(e => e.toLowerCase()) : [];

    const files = fs.readdirSync(romFolder, { withFileTypes: true });
    const games = [];

    files.forEach(file => {
        if (!file.isDirectory()) {
            const ext = path.extname(file.name).toLowerCase();
            if (extensions.includes(ext) || extensions.length === 0) {
                // Return just the base name without extension for searching
                games.push({
                    fileName: file.name,
                    searchName: path.basename(file.name, ext),
                    fullPath: path.join(romFolder, file.name)
                });
            }
        }
    });

    return games;
}

module.exports = {
    getGamesFromFolder
};
