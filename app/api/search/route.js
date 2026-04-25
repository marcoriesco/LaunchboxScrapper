import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const system = searchParams.get('system');
    
    if (!query) {
        return NextResponse.json({ error: 'Search query (q) is required' }, { status: 400 });
    }

    try {
        // Build the Launchbox search URL
        // Extract the platform slug from the mapping URL
        let platformSlug = '';
        if (system) {
            const filePath = path.join(process.cwd(), 'mapping.json');
            const mapping = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const url = mapping[system];
            if (url) {
                // Extract slug from URL like "53-super-nintendo-entertainment-system"
                const match = url.match(/\/(\d+-[^/]+)$/);
                if (match) {
                    // The platform param on search uses the name part
                    const parts = match[1].split('-');
                    parts.shift(); // remove the numeric ID
                    platformSlug = parts.join('-');
                }
            }
        }

        let searchUrl = `https://gamesdb.launchbox-app.com/games/results/${encodeURIComponent(query)}`;
        if (platformSlug) {
            searchUrl += `?platform=${platformSlug}`;
        }

        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const $ = cheerio.load(response.data);
        const games = [];
        
        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            const img = $(el).find('img').attr('src') || '';
            const title = $(el).find('h3, h4, strong').text().trim();
            if (title && img.includes('images.launchbox') && href.includes('/games/detail')) {
                const fullUrl = href.startsWith('http') ? href : 'https://gamesdb.launchbox-app.com' + href;
                if (!games.find(g => g.title === title)) {
                    games.push({ title, img, url: fullUrl });
                }
            }
        });

        return NextResponse.json(games);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to search Launchbox' }, { status: 500 });
    }
}
