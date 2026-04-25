const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const IMAGE_BASE = 'https://images.launchbox-app.com/';

const targetCategories = [
    'Banner',
    'Box - 3D',
    'Box - Back',
    'Box - Front - Reconstructed',
    'Box - Front',
    'Box - Spine',
    'Cart - 3D',
    'Cart - Front',
    'Clear Logo',
    'Fanart - Background',
    'Fanart - Box - Back',
    'Fanart - Box - Front',
    'Fanart - Cart - Front',
    'Screenshot - Game Title',
    'Screenshot - Gameplay',
    'Square'
];

async function getGamesFromSystem(system) {
    if (!system) throw new Error('System is required');

    const filePath = path.join(__dirname, '../../mapping.json');
    if (!fs.existsSync(filePath)) throw new Error('mapping.json not found');

    const mapping = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const url = mapping[system];
    
    if (!url) throw new Error('System URL not found in mapping');

    const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const $ = cheerio.load(response.data);
    const games = [];
    
    $('.game-list-item, .game, .card, table tr, a').each((i, el) => {
        const title = $(el).find('h3, h4, .title, strong').text().trim();
        const img = $(el).find('img').attr('src');
        let gameUrl = $(el).attr('href') || $(el).find('a').attr('href');
        
        if (gameUrl && !gameUrl.startsWith('http')) {
            gameUrl = 'https://gamesdb.launchbox-app.com' + (gameUrl.startsWith('/') ? '' : '/') + gameUrl;
        }
        
        if (title && img && img.includes('images')) {
            if (!games.find(g => g.title === title)) {
                games.push({ title, img, url: gameUrl });
            }
        }
    });

    if (games.length === 0) {
        $('.view-card, .list-group-item').each((i, el) => {
            const title = $(el).text().trim();
            const img = $(el).find('img').attr('src');
            let gameUrl = $(el).find('a').attr('href');
            if (gameUrl && !gameUrl.startsWith('http')) {
                gameUrl = 'https://gamesdb.launchbox-app.com' + (gameUrl.startsWith('/') ? '' : '/') + gameUrl;
            }
            if (title) games.push({ title, img, url: gameUrl });
        });
    }

    return games;
}

async function scrapeGameDetails(url) {
    if (!url) throw new Error('URL is required');

    const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const $ = cheerio.load(response.data);
    const images = [];
    
    const nuxtScript = $('#__NUXT_DATA__').text();
    
    if (nuxtScript) {
        try {
            const nuxtData = JSON.parse(nuxtScript);
            
            for (let i = 0; i < nuxtData.length; i++) {
                const item = nuxtData[i];
                if (item && typeof item === 'object' && 
                    item.imageTypeName !== undefined && 
                    item.fullGameImageFileName !== undefined) {
                    
                    const typeName = nuxtData[item.imageTypeName] || 'Other';
                    const thumbFile = nuxtData[item.imageFileName];
                    const fullFile = nuxtData[item.fullGameImageFileName];
                    const width = nuxtData[item.fullGameImageWidth];
                    const height = nuxtData[item.fullGameImageHeight];
                    const region = nuxtData[item.regionName] || '';
                    
                    if (thumbFile && fullFile) {
                        let type = 'Other';
                        for (const cat of targetCategories) {
                            if (typeName === cat || typeName.startsWith(cat)) {
                                type = cat;
                                break;
                            }
                        }
                        if (type === 'Other' && typeName && typeName !== 'Other') {
                            type = typeName;
                        }
                        
                        images.push({
                            url: IMAGE_BASE + fullFile,
                            thumb: IMAGE_BASE + thumbFile,
                            type,
                            width: width || 0,
                            height: height || 0,
                            region: region || ''
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Failed to parse __NUXT_DATA__:', e.message);
        }
    }
    
    if (images.length === 0) {
        $('img').each((i, el) => {
            let src = $(el).attr('src');
            if (src && src.includes('images.launchbox-app.com') && !src.includes('avatar') && !src.includes('logo-')) {
                const alt = $(el).attr('alt') || $(el).attr('title') || '';
                let type = 'Other';
                for (const cat of targetCategories) {
                    if (alt.includes(cat)) {
                        type = cat;
                        break;
                    }
                }
                if (type === 'Other') {
                    const prevH3 = $(el).closest('.row, .col, div').prevAll('h3').first().text();
                    if (prevH3) {
                        for (const cat of targetCategories) {
                            if (prevH3.includes(cat)) {
                                type = cat;
                                break;
                            }
                        }
                    }
                }
                images.push({ url: src, thumb: src, type, width: 0, height: 0, region: '' });
            }
        });
    }

    return images;
}

async function searchGame(query, platformName) {
    if (!query) throw new Error('Query is required');
    
    let searchUrl = `https://gamesdb.launchbox-app.com/games/results/${encodeURIComponent(query)}`;
    if (platformName) {
        searchUrl += `?platform=${encodeURIComponent(platformName)}`;
    }

    console.log(`[DEBUG] searchGame called with query: ${query}, platformName: ${platformName}`);
    console.log(`[DEBUG] searchUrl: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const $ = cheerio.load(response.data);
    const games = [];
    
    $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const img = $(el).find('img').attr('src') || '';
        const title = $(el).find('h3, h4, strong').text().trim();
        // Removemos a obrigatoriedade da imagem existir na thumb de busca para não pular jogos
        if (title && href.includes('/games/details/')) {
            const fullUrl = href.startsWith('http') ? href : 'https://gamesdb.launchbox-app.com' + href;
            if (!games.find(g => g.title === title)) {
                games.push({ title, img, url: fullUrl });
            }
        }
    });

    return games;
}

module.exports = {
    getGamesFromSystem,
    scrapeGameDetails,
    searchGame
};
