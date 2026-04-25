import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const $ = cheerio.load(response.data);
        const images = [];
        
        // Extract structured data from __NUXT_DATA__ (contains full-size image URLs)
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
                            // Categorize
                            let type = 'Other';
                            for (const cat of targetCategories) {
                                if (typeName === cat || typeName.startsWith(cat)) {
                                    type = cat;
                                    break;
                                }
                            }
                            // If no exact match, keep original type name
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
            } catch (parseErr) {
                console.error('Failed to parse __NUXT_DATA__:', parseErr.message);
            }
        }
        
        // Fallback: if __NUXT_DATA__ extraction failed, use img tag scraping
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

        return NextResponse.json(images);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to scrape game details' }, { status: 500 });
    }
}
