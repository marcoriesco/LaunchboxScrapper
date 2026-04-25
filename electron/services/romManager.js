const fs = require('fs');
const path = require('path');
const configManager = require('./configManager');
const esParser = require('./esParser');

/**
 * Remove tags de região/versão comuns em nomes de ROMs.
 * Ex: "3 Ninjas Kick Back (USA)"              → "3 Ninjas Kick Back"
 *     "Zelda (Japan) [Rev 1]"                 → "Zelda"
 *     "90 Minutes - European Prime Goal (USA)" → "90 Minutes European Prime Goal"
 *     "7th Saga, The (USA)"                   → "The 7th Saga"
 */
function cleanRomName(name) {
    let result = name
        // Remove conteúdo entre parênteses: (USA), (Europe), (Rev 1), (v1.0), etc.
        .replace(/\([^)]*\)/g, '')
        // Remove conteúdo entre colchetes: [!], [b], [h], [01004A40...], etc.
        .replace(/\[[^\]]*\]/g, '')
        // Substitui " - " por espaço (subtítulos com hífen)
        .replace(/\s+-\s+/g, ' ')
        // Remove separadores residuais como hífen, underline no final
        .replace(/[-_\s]+$/, '')
        // Normaliza espaços múltiplos
        .replace(/\s{2,}/g, ' ')
        .trim();

    // Move artigo do final para o início: "Title, The" → "The Title"
    result = result.replace(/^(.+),\s*(The|A|An)$/i, '$2 $1');

    return result;
}

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
                const rawName = path.basename(file.name, ext);
                games.push({
                    fileName: file.name,
                    searchName: rawName,               // Nome original para exibição
                    cleanSearchName: cleanRomName(rawName), // Nome limpo para busca
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
