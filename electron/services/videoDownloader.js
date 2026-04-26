const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

// Resolve yt-dlp binary path
function getYtDlpPath() {
    return path.join(__dirname, '../../bin/yt-dlp.exe');
}

/**
 * Baixa um vídeo do YouTube e corta para a duração especificada.
 * @param {string} videoUrl - URL do YouTube
 * @param {string} outputPath - Caminho final do arquivo .mp4
 * @param {number} duration - Duração em segundos (padrão 20)
 * @returns {Promise<{status: string, path?: string, error?: string}>}
 */
async function downloadVideo(videoUrl, outputPath, duration = 20) {
    const YTDlpWrap = require('yt-dlp-wrap').default || require('yt-dlp-wrap');
    const ytDlpPath = getYtDlpPath();

    if (!fs.existsSync(ytDlpPath)) {
        return { status: 'error', error: 'yt-dlp não encontrado. Execute o setup primeiro.' };
    }

    const ytDlp = new YTDlpWrap(ytDlpPath);

    try {
        // 1. Pega a duração total do vídeo
        let durationStr = await ytDlp.execPromise([videoUrl, '--print', 'duration']);
        let totalSeconds = parseInt(durationStr.trim(), 10);
        
        if (isNaN(totalSeconds)) {
            totalSeconds = 120; // Fallback se falhar
        }

        // 2. Calcula exatamente o meio do vídeo
        let startSec = Math.floor(totalSeconds / 2);
        
        // Se o video for muito curto, começa do zero
        if (totalSeconds < 30) {
            startSec = 0;
        } else if (startSec + duration > totalSeconds) {
            startSec = Math.max(0, totalSeconds - duration);
        }

        const endSec = startSec + duration;

        // 3. yt-dlp nativamente baixa apenas a seção do meio usando ffmpeg
        await ytDlp.execPromise([
            videoUrl,
            '-f', 'best[height<=480]',
            '-o', outputPath,
            '--no-playlist',
            '--ffmpeg-location', ffmpegPath,
            '--download-sections', `*${startSec}-${endSec}`,
            '--force-keyframes-at-cuts',
            '--socket-timeout', '15'
        ]);

        return { status: 'downloaded', path: outputPath };
    } catch (e) {
        return { status: 'error', error: e.message || String(e) };
    }
}

/**
 * Verifica se o yt-dlp está disponível, e baixa se necessário.
 */
async function ensureYtDlp() {
    const ytDlpPath = getYtDlpPath();
    if (fs.existsSync(ytDlpPath)) {
        return { ready: true, path: ytDlpPath };
    }

    try {
        const binDir = path.dirname(ytDlpPath);
        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true });
        }
        const YTDlpWrap = require('yt-dlp-wrap').default || require('yt-dlp-wrap');
        await YTDlpWrap.downloadFromGithub(ytDlpPath);
        return { ready: true, path: ytDlpPath };
    } catch (e) {
        return { ready: false, error: e.message };
    }
}

module.exports = {
    downloadVideo,
    ensureYtDlp
};
