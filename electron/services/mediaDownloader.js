const fs = require('fs');
const path = require('path');
const axios = require('axios');
const configManager = require('./configManager');
const videoDownloader = require('./videoDownloader');

async function downloadMedia(systemName, gameFileName, mediaImages, videoUrl = null) {
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
        
        // Skip if exists and overwrite is disabled
        if (fs.existsSync(finalFilePath) && !config.overwriteExisting) {
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

    // Baixa vídeo se configurado e houver URL
    if (videoUrl && config.enabledMediaTypes && config.enabledMediaTypes['video']) {
        const customVideoFolder = (config.customFolderNames && config.customFolderNames['video']) 
            ? config.customFolderNames['video'] 
            : 'video';
            
        const videoTargetFolder = path.join(basePath, customVideoFolder);
        if (!fs.existsSync(videoTargetFolder)) {
            fs.mkdirSync(videoTargetFolder, { recursive: true });
        }
        
        const gameBaseName = path.basename(gameFileName, path.extname(gameFileName));
        const videoFinalFilePath = path.join(videoTargetFolder, `${gameBaseName}.mp4`);
        
        // Skip if exists and overwrite is disabled
        if (fs.existsSync(videoFinalFilePath) && !config.overwriteExisting) {
            results.push({ type: 'video', path: videoFinalFilePath, status: 'exists' });
        } else {
            const videoDuration = config.videoDuration || 20;
            const videoResult = await videoDownloader.downloadVideo(videoUrl, videoFinalFilePath, videoDuration);
            if (videoResult.status === 'error') {
                results.push({ type: 'video', status: 'error', error: videoResult.error });
            } else {
                results.push({ type: 'video', path: videoFinalFilePath, status: 'downloaded' });
            }
        }
    }

    return results;
}

/**
 * Verifica se TODAS as mídias ativadas nas configurações já existem para o jogo,
 * permitindo pular a busca (scraping) quando overwrite=false.
 */
function checkMediaExists(systemName, gameFileName) {
    const config = configManager.getConfig();
    // Se estiver com overwrite ligado, nunca pula
    if (config.overwriteExisting) return false;

    const retrobatPath = config.retrobatPath;
    if (!retrobatPath) return false;

    const basePath = config.devMode?.mediaTestsPath 
        ? path.join(retrobatPath, 'roms', systemName, 'MEDIA_TESTS')
        : path.join(retrobatPath, 'roms', systemName, 'media');

    if (!fs.existsSync(basePath)) return false;

    const enabledTypes = Object.keys(config.enabledMediaTypes || {}).filter(k => config.enabledMediaTypes[k]);
    if (enabledTypes.length === 0) return false;

    const gameBaseName = path.basename(gameFileName, path.extname(gameFileName));

    for (const type of enabledTypes) {
        const customFolder = (config.customFolderNames && config.customFolderNames[type]) 
            ? config.customFolderNames[type] 
            : type;
            
        const targetFolder = path.join(basePath, customFolder);
        if (!fs.existsSync(targetFolder)) return false; // Falta uma pasta de mídia

        // Verifica se há algum arquivo começando com o nome do jogo nessa pasta
        const files = fs.readdirSync(targetFolder);
        const hasMedia = files.some(f => {
            const ext = path.extname(f);
            const base = path.basename(f, ext);
            return base === gameBaseName;
        });

        if (!hasMedia) return false; // Faltou uma mídia ativada
    }

    return true; // Todas as mídias ativadas existem
}

module.exports = {
    downloadMedia,
    checkMediaExists
};
