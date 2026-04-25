'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, MonitorPlay, Gamepad2, DownloadCloud, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';

export default function ScraperPage() {
    const [systems, setSystems] = useState([]);
    const [selectedSystem, setSelectedSystem] = useState('');
    
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState('');

    const [status, setStatus] = useState('');
    const [logs, setLogs] = useState([]);
    const [isScraping, setIsScraping] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    
    // Referência para podermos cancelar o loop de forma segura
    const cancelRef = useRef(false);

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getSystems().then(res => {
                if (!res.error) {
                    setSystems(res.sort((a, b) => a.fullname.localeCompare(b.fullname)));
                } else {
                    addLog('Erro ao carregar sistemas: ' + res.error, 'error');
                }
            });
        }
    }, []);

    useEffect(() => {
        if (selectedSystem && window.electronAPI) {
            setGames([]);
            setSelectedGame('');
            window.electronAPI.getGamesFromFolder(selectedSystem).then(res => {
                if (!res.error) {
                    setGames(res.sort((a, b) => a.searchName.localeCompare(b.searchName)));
                } else {
                    addLog(res.error, 'error');
                }
            });
        }
    }, [selectedSystem]);

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const scrapeSingleGame = async (system, gameObj) => {
        addLog(`Iniciando busca para: ${gameObj.searchName}`, 'info');

        const sysObj = systems.find(s => s.name === system);
        const platformName = sysObj ? sysObj.launchboxPlatform : system;

        // 1. Busca na Launchbox (Pesquisa)
        const searchResults = await window.electronAPI.launchboxSearchGame({ query: gameObj.searchName, platformName });
        if (searchResults.error || searchResults.length === 0) {
            addLog(`❌ Nenhum resultado LaunchBox encontrado para ${gameObj.searchName}`, 'error');
            return;
        }

        // Pega o primeiro resultado (o mais relevante)
        const bestMatch = searchResults[0];
        addLog(`Encontrado LaunchBox URL: ${bestMatch.url}`, 'info');

        // 2. Faz o scraping da página do jogo
        const media = await window.electronAPI.launchboxScrapeGame(bestMatch.url);
        if (media.error || media.length === 0) {
            addLog(`⚠️ Nenhuma mídia encontrada na página de ${gameObj.searchName}`, 'warning');
            return;
        }

        addLog(`⬇️ Baixando ${media.length} mídias para ${gameObj.searchName}...`, 'info');

        // 3. Baixa e salva as mídias
        const downloadResult = await window.electronAPI.downloadMedia({
            systemName: system,
            gameFileName: gameObj.fileName,
            mediaImages: media
        });

        if (downloadResult.error) {
            addLog(`❌ Erro no download: ${downloadResult.error}`, 'error');
        } else {
            const successCount = downloadResult.filter(d => d.status === 'downloaded' || d.status === 'exists').length;
            addLog(`✅ Mídias salvas com sucesso! (${successCount}/${media.length})`, 'success');
        }
    };

    const handleManualSearch = async () => {
        if (!selectedSystem || !selectedGame) return;
        setIsScraping(true);
        setStatus('Scraping Manual em Andamento...');
        
        const gameObj = games.find(g => g.fileName === selectedGame);
        await scrapeSingleGame(selectedSystem, gameObj);
        
        setStatus('Concluído.');
        setIsScraping(false);
    };

    const handleAutoScrape = async () => {
        if (!selectedSystem) return;
        setIsScraping(true);
        cancelRef.current = false;
        setStatus('Scraping Automático em Andamento...');
        setProgress({ current: 0, total: games.length });
        
        addLog(`Iniciando scraping automático de ${games.length} jogos para ${selectedSystem}`, 'info');
        
        for (let i = 0; i < games.length; i++) {
            setProgress({ current: i + 1, total: games.length });
            if (cancelRef.current) {
                addLog('⚠️ Scraping Automático Cancelado pelo Usuário', 'warning');
                setStatus('Cancelado.');
                setIsScraping(false);
                setProgress({ current: 0, total: 0 });
                return;
            }
            await scrapeSingleGame(selectedSystem, games[i]);
            // Pequeno delay pra não tomar ban
            await delay(1000);
        }

        setStatus('Concluído.');
        setIsScraping(false);
        setProgress({ current: 0, total: 0 });
    };

    const handleStopScrape = () => {
        if (isScraping) {
            cancelRef.current = true;
            setStatus('Cancelando...');
        }
    };

    return (
        <div className="max-w-5xl animate-[fadeIn_0.5s_ease-out]">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold mb-2">Scraper</h1>
                <p className="text-gray-400">Selecione uma plataforma para buscar e baixar as mídias.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Painel de Controles */}
                <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                            <MonitorPlay size={16} /> Plataforma (Obrigatório)
                        </label>
                        <select 
                            value={selectedSystem} 
                            onChange={(e) => setSelectedSystem(e.target.value)}
                            disabled={isScraping}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">Selecione um sistema...</option>
                            {systems.map(sys => (
                                <option key={sys.name} value={sys.name}>{sys.fullname} ({sys.name})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                            <Gamepad2 size={16} /> Jogo (Opcional)
                        </label>
                        <select 
                            value={selectedGame} 
                            onChange={(e) => setSelectedGame(e.target.value)}
                            disabled={!selectedSystem || isScraping}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">Todos os jogos ({games.length})</option>
                            {games.map((g, index) => (
                                <option key={`${g.fileName}-${index}`} value={g.fileName}>{g.searchName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button 
                            onClick={handleManualSearch}
                            disabled={!selectedSystem || !selectedGame || isScraping}
                            className="flex-1 flex justify-center items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                        >
                            <Search size={18} />
                            Busca Manual
                        </button>
                        
                        {isScraping ? (
                            <button 
                                onClick={handleStopScrape}
                                className="flex-2 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-red-500/25 transition-all"
                            >
                                <AlertTriangle size={18} />
                                Parar Scrape
                            </button>
                        ) : (
                            <button 
                                onClick={handleAutoScrape}
                                disabled={!selectedSystem}
                                className="flex-2 flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
                            >
                                <DownloadCloud size={18} />
                                Scrape Automático
                            </button>
                        )}
                    </div>
                </div>

                {/* Console de Logs */}
                <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl flex flex-col shadow-inner overflow-hidden h-[500px]">
                    <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                        <span className="font-semibold text-sm flex items-center gap-2">
                            Terminal de Execução
                        </span>
                        <div className="flex items-center gap-4">
                            {progress.total > 0 && (
                                <span className="text-xs font-bold text-gray-400">
                                    Progresso: {progress.current} / {progress.total}
                                </span>
                            )}
                            {status && (
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full animate-pulse">
                                    {status}
                                </span>
                            )}
                        </div>
                    </div>
                    {progress.total > 0 && (
                        <div className="w-full bg-gray-800 h-1">
                            <div 
                                className="bg-purple-500 h-1 transition-all duration-300 ease-out" 
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            ></div>
                        </div>
                    )}
                    <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs">
                        {logs.length === 0 ? (
                            <div className="text-gray-600 text-center mt-10">Aguardando execução...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className={`flex gap-3 ${
                                    log.type === 'error' ? 'text-red-400' :
                                    log.type === 'success' ? 'text-green-400' :
                                    log.type === 'warning' ? 'text-yellow-400' :
                                    'text-gray-400'
                                }`}>
                                    <span className="text-gray-600 shrink-0">[{log.time}]</span>
                                    <span>{log.msg}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
