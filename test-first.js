const axios = require('axios');
const cheerio = require('cheerio');

async function testMissingFirst() {
    const res = await axios.get('https://gamesdb.launchbox-app.com/games/results/mario?platform=Super+Nintendo+Entertainment+System');
    const $ = cheerio.load(res.data);
    
    // Original logic
    const gamesOld = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const img = $(el).find('img').attr('src') || '';
        const title = $(el).find('h3, h4, strong').text().trim();
        if (title && img.includes('images.launchbox') && href.includes('/games/detail')) {
            if (!gamesOld.find(g => g.title === title)) {
                gamesOld.push({ title });
            }
        }
    });

    // New logic
    const gamesNew = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const title = $(el).find('h3, h4, strong').text().trim();
        if (title && href.includes('/games/details/')) {
            if (!gamesNew.find(g => g.title === title)) {
                gamesNew.push({ title });
            }
        }
    });

    console.log("Old logic first 3:", gamesOld.slice(0, 3));
    console.log("New logic first 3:", gamesNew.slice(0, 3));
}
testMissingFirst();
