'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
    const [systems, setSystems] = useState([]);
    const [system, setSystem] = useState('');
    const [search, setSearch] = useState('');
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('search'); // 'search' or 'browse'

    useEffect(() => {
        fetch('/api/systems')
            .then(res => res.json())
            .then(data => setSystems(Object.keys(data).sort()))
            .catch(err => console.error(err));
    }, []);

    const handleSearch = async () => {
        if (!search.trim()) {
            setError('Please type a game name to search.');
            return;
        }
        setLoading(true);
        setError('');
        setGames([]);
        
        try {
            let url = `/api/search?q=${encodeURIComponent(search.trim())}`;
            if (system) {
                url += `&system=${encodeURIComponent(system)}`;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGames(data);
            if (data.length === 0) setError('No games found. Try a different search term.');
        } catch (err) {
            setError('Error searching Launchbox. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBrowse = async () => {
        if (!system) {
            setError('Please select a system to browse.');
            return;
        }
        setLoading(true);
        setError('');
        setGames([]);
        
        try {
            const res = await fetch(`/api/scrape?system=${system}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setGames(data);
        } catch (err) {
            setError('Error scraping data from Launchbox.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const filteredGames = mode === 'browse' && search.trim()
        ? games.filter(g => g.title.toLowerCase().includes(search.toLowerCase().trim()))
        : games;

    return (
        <>
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => { setMode('search'); setGames([]); setError(''); }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all text-sm uppercase tracking-wider ${
                        mode === 'search' 
                            ? 'bg-gradient-to-br from-primary to-primaryHover text-white shadow-[0_5px_15px_rgba(99,102,241,0.4)]' 
                            : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                >
                    🔍 Search Game
                </button>
                <button
                    onClick={() => { setMode('browse'); setGames([]); setError(''); }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all text-sm uppercase tracking-wider ${
                        mode === 'browse' 
                            ? 'bg-gradient-to-br from-primary to-primaryHover text-white shadow-[0_5px_15px_rgba(99,102,241,0.4)]' 
                            : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                >
                    📂 Browse Platform
                </button>
            </div>

            <section className="glass-panel p-8 rounded-3xl flex flex-wrap gap-6 items-end mb-12">
                {/* System selector - always visible */}
                <div className="flex-1 min-w-[250px] flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                        Platform / System {mode === 'search' ? '(optional)' : ''}
                    </label>
                    <div className="relative">
                        <select 
                            className="w-full bg-slate-900/80 border border-white/10 text-white p-4 rounded-xl text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_15px_rgba(99,102,241,0.4)] appearance-none"
                            value={system} 
                            onChange={e => setSystem(e.target.value)}
                        >
                            <option value="">
                                {mode === 'search' ? 'All Platforms' : 'Select a System...'}
                            </option>
                            {systems.map(sys => (
                                <option key={sys} value={sys}>{sys.toUpperCase()}</option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</span>
                    </div>
                </div>
                
                {/* Search input */}
                <div className="flex-1 min-w-[250px] flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                        {mode === 'search' ? 'Game Name' : 'Filter Results'}
                    </label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-900/80 border border-white/10 text-white p-4 rounded-xl text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={mode === 'search' ? 'Type a game name (e.g. Zelda, Mario...)' : 'Type to filter loaded games...'} 
                    />
                </div>
                
                <button 
                    onClick={mode === 'search' ? handleSearch : handleBrowse} 
                    disabled={loading}
                    className="bg-gradient-to-br from-primary to-primaryHover text-white px-8 h-[58px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(99,102,241,0.4)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    {loading ? (
                        <div className="spinner" style={{width: 20, height: 20, borderWidth: 2}}></div>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    )}
                    {mode === 'search' ? 'Search' : 'Load Games'}
                </button>
            </section>

            <main>
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16 gap-6">
                        <div className="spinner"></div>
                        <p className="text-slate-400">
                            {mode === 'search' ? 'Searching on Launchbox...' : 'Scraping from Launchbox...'}
                        </p>
                    </div>
                )}
                
                {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl text-center mb-8">{error}</div>}
                
                {!loading && games.length > 0 && (
                    <>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                            <h2 className="text-2xl text-slate-400">
                                {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found
                                {mode === 'search' && system && <span className="text-primary ml-2">on {system.toUpperCase()}</span>}
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-8">
                            {filteredGames.map((game, i) => (
                                <Link 
                                    href={`/game/details?url=${encodeURIComponent(game.url || '')}&img=${encodeURIComponent(game.img)}&title=${encodeURIComponent(game.title)}`} 
                                    key={i} 
                                    className="game-card-anim bg-cardBg border border-white/10 rounded-2xl overflow-hidden flex flex-col text-white backdrop-blur-md transition-all duration-400 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)] hover:border-white/30"
                                    style={{animationDelay: `${i * 0.05}s`}}
                                >
                                    <div className="w-full pt-[100%] relative bg-black/30 overflow-hidden group">
                                        <img 
                                            src={game.img} 
                                            alt={game.title} 
                                            loading="lazy" 
                                            className="absolute top-0 left-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => e.target.src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/></svg>'} 
                                        />
                                    </div>
                                    <div className="p-5 flex-grow flex items-center justify-center text-center bg-gradient-to-t from-slate-900/90 to-transparent">
                                        <h3 className="text-lg font-semibold line-clamp-2">{game.title}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </>
    );
}
