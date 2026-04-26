const Database = require('better-sqlite3');
const path = require('path');

const IMAGE_BASE = 'https://images.launchbox-app.com/';

let db = null;

function getDb() {
    if (!db) {
        const dbPath = path.join(__dirname, '../../launchbox/LaunchBox.Metadata.db');
        db = new Database(dbPath, { readonly: true });
        // Performance: WAL mode for reads
        db.pragma('journal_mode = WAL');
    }
    return db;
}

// Cache de resolução de plataformas
const platformCache = {};

/**
 * Resolve o nome canônico da plataforma no banco usando PlatformAlternateNames.
 * Ex: "Super Nintendo" → "Super Nintendo Entertainment System"
 */
function resolvePlatformName(platformName) {
    if (!platformName) return platformName;
    if (platformCache[platformName]) return platformCache[platformName];
    
    const database = getDb();
    
    // 1. Verifica se já é um nome canônico (existe em Platforms)
    const exact = database.prepare('SELECT Name FROM Platforms WHERE Name = ?').get(platformName);
    if (exact) {
        platformCache[platformName] = exact.Name;
        return exact.Name;
    }
    
    // 2. Busca nos nomes alternativos
    const alt = database.prepare('SELECT Name FROM PlatformAlternateNames WHERE Alternate = ?').get(platformName);
    if (alt) {
        platformCache[platformName] = alt.Name;
        return alt.Name;
    }
    
    // 3. Busca parcial (LIKE) nos alternativos
    const partial = database.prepare('SELECT Name FROM PlatformAlternateNames WHERE Alternate LIKE ? LIMIT 1').get(`%${platformName}%`);
    if (partial) {
        platformCache[platformName] = partial.Name;
        return partial.Name;
    }
    
    // Fallback: retorna o nome original
    platformCache[platformName] = platformName;
    return platformName;
}

/**
 * Busca um jogo pelo nome na plataforma especificada.
 * Retorna uma lista de matches ordenada por relevância.
 */
function searchGame(query, platformName) {
    const database = getDb();
    
    // Resolve o nome canônico da plataforma via aliases
    const resolvedPlatform = resolvePlatformName(platformName);
    
    console.log(`[DB] searchGame: query="${query}", platform="${platformName}" -> resolved="${resolvedPlatform}"`);
    
    // Normaliza a query para comparação (mesmo formato do CompareName no DB)
    const compareQuery = query.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
    // O LaunchBox remove artigos iniciais (The, A, An) do CompareName
    const compareQueryNoArticle = compareQuery.replace(/^(THE|A|AN)\s+/i, '').trim();
    
    // 1. Busca exata pelo CompareName (tenta com e sem artigo)
    let results = database.prepare(`
        SELECT DatabaseID, Name, Platform, VideoURL
        FROM Games
        WHERE (CompareName = ? OR CompareName = ?) AND Platform = ?
        LIMIT 1
    `).all(compareQuery, compareQueryNoArticle, resolvedPlatform);

    // 2. Se não encontrou exato, busca por LIKE
    if (results.length === 0) {
        results = database.prepare(`
            SELECT DatabaseID, Name, Platform, VideoURL
            FROM Games
            WHERE CompareName LIKE ? AND Platform = ?
            ORDER BY LENGTH(Name) ASC
            LIMIT 20
        `).all(`%${compareQuery}%`, resolvedPlatform);
    }

    // 3. Se ainda não encontrou, tenta nos nomes alternativos
    if (results.length === 0) {
        results = database.prepare(`
            SELECT g.DatabaseID, g.Name, g.Platform, g.VideoURL
            FROM GameAlternateTitles alt
            JOIN Games g ON g.DatabaseID = alt.DatabaseID
            WHERE alt.AltNameCompareValue LIKE ? AND g.Platform = ?
            ORDER BY LENGTH(g.Name) ASC
            LIMIT 20
        `).all(`%${compareQuery}%`, resolvedPlatform);
    }

    // 4. Última tentativa: sem filtro de plataforma
    if (results.length === 0) {
        results = database.prepare(`
            SELECT DatabaseID, Name, Platform, VideoURL
            FROM Games
            WHERE CompareName = ?
            LIMIT 5
        `).all(compareQuery);
    }

    return results.map(r => ({
        title: r.Name,
        databaseId: r.DatabaseID,
        platform: r.Platform,
        videoUrl: r.VideoURL || null,
        url: `https://gamesdb.launchbox-app.com/games/details/${r.DatabaseID}`
    }));
}

/**
 * Busca as imagens de um jogo pelo DatabaseID.
 * Retorna a lista com URLs completas e metadados.
 */
function getGameImages(databaseId) {
    const database = getDb();
    
    const images = database.prepare(`
        SELECT FileName, Type, Region
        FROM GameImages
        WHERE DatabaseId = ?
    `).all(databaseId);

    return images.map(img => ({
        url: IMAGE_BASE + img.FileName,
        thumb: IMAGE_BASE + img.FileName,
        type: img.Type || 'Other',
        width: 0,
        height: 0,
        region: img.Region || ''
    }));
}

/**
 * Retorna a lista de plataformas disponíveis no banco.
 */
function getPlatforms() {
    const database = getDb();
    return database.prepare('SELECT Name FROM Platforms ORDER BY Name').all().map(p => p.Name);
}

function closeDb() {
    if (db) {
        db.close();
        db = null;
    }
}

module.exports = {
    searchGame,
    getGameImages,
    getPlatforms,
    closeDb
};
