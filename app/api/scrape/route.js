import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system');
    
    if (!system) {
        return NextResponse.json({ error: 'System is required' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'mapping.json');
        const mapping = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const url = mapping[system];
        
        if (!url) {
            return NextResponse.json({ error: 'System URL not found in mapping' }, { status: 404 });
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const $ = cheerio.load(response.data);
        const games = [];
        
        $('.game-list-item, .game, .card, table tr, a').each((i, el) => {
            const title = $(el).find('h3, h4, .title, strong').text().trim();
            const img = $(el).find('img').attr('src');
            let gameUrl = $(el).attr('href');
            if(!gameUrl) gameUrl = $(el).find('a').attr('href');
            if(gameUrl && !gameUrl.startsWith('http')) {
                gameUrl = 'https://gamesdb.launchbox-app.com' + (gameUrl.startsWith('/') ? '' : '/') + gameUrl;
            }
            
            if(title && img && img.includes('images')) {
                if (!games.find(g => g.title === title)) {
                    games.push({ title, img, url: gameUrl });
                }
            }
        });

        if(games.length === 0) {
            $('.view-card, .list-group-item').each((i, el) => {
                const title = $(el).text().trim();
                const img = $(el).find('img').attr('src');
                let gameUrl = $(el).find('a').attr('href');
                if(gameUrl && !gameUrl.startsWith('http')) {
                    gameUrl = 'https://gamesdb.launchbox-app.com' + (gameUrl.startsWith('/') ? '' : '/') + gameUrl;
                }
                if(title) games.push({ title, img, url: gameUrl });
            });
        }

        return NextResponse.json(games);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to scrape Launchbox' }, { status: 500 });
    }
}
