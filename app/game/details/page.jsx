'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function GameDetails() {
    const searchParams = useSearchParams();
    const title = searchParams.get('title');
    const defaultImg = searchParams.get('img');
    const url = searchParams.get('url');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            if (!url || !url.startsWith('http')) {
                setLoading(false);
                setError('Invalid Launchbox URL for this game.');
                return;
            }

            try {
                const res = await fetch(`/api/scrape-game?url=${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                
                // Filter out duplicates
                const unique = [];
                data.forEach(img => {
                    if(!unique.find(u => u.url === img.url)) unique.push(img);
                });
                
                setImages(unique);
            } catch (err) {
                setError('Failed to load extra images from Launchbox.');
            } finally {
                setLoading(false);
            }
        };

        if (url) {
            fetchDetails();
        }
    }, [url]);

    if (!title) {
        return (
            <main className="text-center mt-8">
                <div className="flex flex-col items-center justify-center py-16 gap-6">
                    <div className="spinner"></div>
                    <p className="text-slate-400">Loading Game Details...</p>
                </div>
            </main>
        );
    }

    return (
        <main>
            <div className="mb-8">
                <Link href="/" className="bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:bg-white/20 transition-all">
                    ← Back to Search
                </Link>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 bg-cardBg rounded-3xl p-8 lg:p-12 border border-white/10 backdrop-blur-xl mb-12">
                <div className="flex-1 min-w-[300px] rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center p-8 border border-white/5">
                    <img src={defaultImg} alt={title} className="max-w-full h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
                </div>
                
                <div className="flex-[2] flex flex-col gap-4">
                    <h2 className="text-4xl lg:text-5xl font-extrabold mb-2">{title}</h2>
                    <p className="text-slate-400 text-lg mb-4">
                        Aqui estão todas as imagens e mídias encontradas no Launchbox para este jogo!
                    </p>
                    
                    {loading && (
                        <div className="flex items-center gap-4 text-primary">
                            <div className="w-6 h-6 border-2 border-white/10 border-l-primary rounded-full animate-spin"></div>
                            Scraping Launchbox images...
                        </div>
                    )}

                    {error && <div className="text-red-400">{error}</div>}

                    {!loading && images.length > 0 && (
                        <div className="mt-4 flex flex-col gap-8">
                            {Array.from(new Set(images.map(img => img.type))).sort().map(category => (
                                <div key={category} className="category-section">
                                    <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">
                                        {category}
                                        <span className="text-sm font-normal text-slate-500 ml-3">
                                            {images.filter(img => img.type === category).length} image{images.filter(img => img.type === category).length !== 1 ? 's' : ''}
                                        </span>
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {images.filter(img => img.type === category).map((img, i) => (
                                            <a 
                                                href={img.url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                key={i} 
                                                className="block group relative bg-black/40 rounded-xl overflow-hidden border border-white/10 aspect-square"
                                            >
                                                <img 
                                                    src={img.thumb} 
                                                    alt={img.type} 
                                                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-110" 
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                    <span className="text-xs font-bold px-3 py-2 bg-primary rounded-md text-white shadow-lg">View Full Size</span>
                                                    {img.width > 0 && (
                                                        <span className="text-[10px] text-slate-300">{img.width} × {img.height}</span>
                                                    )}
                                                </div>
                                                {img.region && (
                                                    <div className="absolute top-2 right-2 bg-black/70 text-[10px] text-slate-300 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                                        {img.region}
                                                    </div>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && images.length === 0 && !error && (
                        <div className="text-slate-500">Nenhuma imagem extra encontrada.</div>
                    )}
                </div>
            </div>
        </main>
    );
}
