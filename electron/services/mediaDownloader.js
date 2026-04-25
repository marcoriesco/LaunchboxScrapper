const fs = require('fs');
const path = require('path');
const axios = require('axios');
const configManager = require('./configManager');

async function downloadMedia(systemName, gameFileName, mediaImages) {
    const config = configManager.getConfig();
    const retrobatPath = config.retrobatPath;

    if (!retrobatPath) return { error: 'Caminho do Retrobat não configurado' };

    const basePath = config.devMode?.mediaTestsPath 
        ? path.join(retrobatPath, 'roms', systemName, 'MEDIA_TESTS')
        : path.join(retrobatPath, 'roms', systemName, 'media');

    // Create the base media directory if it doesn't exist
    if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
    }

    const mapping = config.mediaMapping || {};
    const results = [];
    const downloadedCategories = new Set();

    // Ordena as imagens pela prioridade de região configurada
    const preferredRegions = config.preferredRegions || [];
    const sortedImages = [...mediaImages].sort((a, b) => {
        const regionA = (a.region || '').toLowerCase();
        const regionB = (b.region || '').toLowerCase();
        const indexA = preferredRegions.findIndex(r => regionA.includes(r.toLowerCase()));
        const indexB = preferredRegions.findIndex(r => regionB.includes(r.toLowerCase()));
        // Regiões não listadas ficam no final (index -1 vira Infinity)
        const prioA = indexA === -1 ? Infinity : indexA;
        const prioB = indexB === -1 ? Infinity : indexB;
        return prioA - prioB;
    });

    for (const image of sortedImages) {
        // Find mapped category or ignore
        const mappedFolder = mapping[image.type];
        if (!mappedFolder) continue; // Category not mapped, skip downloading

        // Verifica configurações (caso a categoria esteja desativada)
        if (config.enabledMediaTypes && config.enabledMediaTypes[mappedFolder] === false) {
            continue;
        }

        // NOVO: Baixar apenas a primeira mídia de cada categoria
        if (downloadedCategories.has(mappedFolder)) continue;

        const customFolderName = (config.customFolderNames && config.customFolderNames[mappedFolder]) 
            ? config.customFolderNames[mappedFolder] 
            : mappedFolder;

        const targetFolder = path.join(basePath, customFolderName);
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        const urlWithoutQuery = image.url.split('?')[0];
        const ext = path.extname(urlWithoutQuery) || '.png';
        const gameBaseName = path.basename(gameFileName, path.extname(gameFileName));
        const finalFilePath = path.join(targetFolder, `${gameBaseName}${ext}`);
        
        // Skip if exists
        if (fs.existsSync(finalFilePath)) {
            results.push({ type: image.type, path: finalFilePath, status: 'exists' });
            downloadedCategories.add(mappedFolder);
            continue;
        }

        const tmpFilePath = finalFilePath + '.tmp';

        try {
            const response = await axios({
                url: image.url,
                method: 'GET',
                responseType: 'stream',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(tmpFilePath);
                response.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Rename temp file to final file
            fs.renameSync(tmpFilePath, finalFilePath);
            results.push({ type: image.type, path: finalFilePath, status: 'downloaded' });
            downloadedCategories.add(mappedFolder);
        } catch (e) {
            console.error(`Erro ao baixar imagem: ${image.url}`, e.message);
            if (fs.existsSync(tmpFilePath)) {
                fs.unlinkSync(tmpFilePath);
            }
            results.push({ type: image.type, status: 'error', error: e.message });
        }
    }

    return results;
}

module.exports = {
    downloadMedia
};
