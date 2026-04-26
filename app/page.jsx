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
    const [verboseLog, setVerboseLog] = useState(true); // Carregado do config
    
    // Referência para podermos cancelar o loop de forma segura
    const cancelRef = useRef(false);
    // Contadores de sessão
    const statsRef = useRef({ success: 0, notFound: 0, error: 0 });

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getSystems().then(res => {
                if (!res.error) {
                    setSystems(res.sort((a, b) => a.fullname.localeCompare(b.fullname)));
                } else {
                    addLog('Erro ao carregar sistemas: ' + res.error, 'error');
                }
            });
            // Carrega verbose do config
            window.electronAPI.getConfig().then(c => {
                setVerboseLog(c?.verboseLog !== false); // padrão: true
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

    const addLog = (msg, type = 'info', force = false) => {
        // Se verbose estiver desligado, só exibe 'success', 'error', 'summary' e logs forçados
        if (!force && !verboseLog && type === 'info') return;
        setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const printSummary = (label) => {
        const { success, notFound, error } = statsRef.current;
        const total = success + notFound + error;
        setLogs(prev => [
            ...prev,
            { msg: '─'.repeat(50), type: 'summary', time: new Date().toLocaleTimeString() },
            { msg: `${label}`, type: 'summary', time: new Date().toLocaleTimeString() },
            { msg: `📊 Total processados : ${total}`, type: 'summary', time: new Date().toLocaleTimeString() },
            { msg: `✅ Sucesso           : ${success}`, type: 'success', time: new Date().toLocaleTimeString() },
            { msg: `🔍 Não encontrados   : ${notFound}`, type: 'warning', time: new Date().toLocaleTimeString() },
            { msg: `❌ Erros             : ${error}`, type: 'error', time: new Date().toLocaleTimeString() },
            { msg: '─'.repeat(50), type: 'summary', time: new Date().toLocaleTimeString() },
        ]);
    };

    const scrapeSingleGame = async (system, gameObj) => {
        // Usa o nome limpo (sem tags de região/versão) para busca
        const queryName = gameObj.cleanSearchName || gameObj.searchName;
        addLog(`Iniciando busca para: ${gameObj.searchName}${queryName !== gameObj.searchName ? ` (pesquisando: "${queryName}")` : ''}`, 'info');

        const sysObj = systems.find(s => s.name === system);
        const platformName = sysObj ? sysObj.launchboxPlatform : system;

        let media = [];

        // === MODO LOCAL (Banco de Dados) ===
        const dbResults = await window.electronAPI.dbSearchGame({ query: queryName, platformName });
        
        if (dbResults.error) {
            addLog(`⚠️ DB Local erro: ${dbResults.error}`, 'warning');
        }
        
        if (!dbResults.error && dbResults.length > 0) {
            // Encontra o melhor match (prioriza exato)
            let bestMatch = dbResults[0];
            if (dbResults.length > 1) {
                const normalize = (str) => {
                    const noTags = str.replace(/\([^)]*\)|\[[^\]]*\]/g, '');
                    return noTags.toLowerCase().replace(/[^a-z0-9]/g, '');
                };
                const normalizedQuery = normalize(queryName);
                const exactMatch = dbResults.find(r => normalize(r.title) === normalizedQuery);
                if (exactMatch) bestMatch = exactMatch;
            }
            
            addLog(`🔗 DB Local: ${bestMatch.title} (ID: ${bestMatch.databaseId})`, 'info');

            // Busca imagens do jogo no banco local
            const dbImages = await window.electronAPI.dbGetImages(bestMatch.databaseId);
            if (!dbImages.error && dbImages.length > 0) {
                media = dbImages;
            }
        }

        // === FALLBACK ONLINE (se não achou no banco local) ===
        if (media.length === 0) {
            addLog(`🌐 Banco local sem resultado, buscando online...`, 'info');
            
            const searchResults = await window.electronAPI.launchboxSearchGame({ query: queryName, platformName });
            if (searchResults.error || searchResults.length === 0) {
                addLog(`❌ Não encontrado: "${queryName}"`, 'error', true);
                statsRef.current.notFound++;
                return;
            }

            let bestMatch = searchResults[0];
            if (searchResults.length > 1) {
                const normalize = (str) => {
                    const noTags = str.replace(/\([^)]*\)|\[[^\]]*\]/g, '');
                    return noTags.toLowerCase().replace(/[^a-z0-9]/g, '');
                };
                const normalizedQuery = normalize(queryName);
                const exactMatch = searchResults.find(r => normalize(r.title) === normalizedQuery);
                if (exactMatch) bestMatch = exactMatch;
            }
            
            addLog(`🔗 Online: ${bestMatch.title}`, 'info');

            const onlineMedia = await window.electronAPI.launchboxScrapeGame(bestMatch.url);
            if (!onlineMedia.error && onlineMedia.length > 0) {
                media = onlineMedia;
            }
        }

        if (media.length === 0) {
            addLog(`⚠️ Sem mídia: ${gameObj.searchName}`, 'warning', true);
            statsRef.current.notFound++;
            return;
        }

        addLog(`⬇️ Encontradas ${media.length} imagens para ${gameObj.searchName}...`, 'info');

        // Baixa e salva as mídias
        const downloadResult = await window.electronAPI.downloadMedia({
            systemName: system,
            gameFileName: gameObj.fileName,
            mediaImages: media
        });

        if (downloadResult.error) {
            addLog(`❌ Erro no download: ${downloadResult.error}`, 'error', true);
            statsRef.current.error++;
        } else {
            const successCount = downloadResult.filter(d => d.status === 'downloaded' || d.status === 'exists').length;
            addLog(`✅ ${gameObj.searchName} — ${successCount} mídia(s) salva(s)`, 'success', true);
            statsRef.current.success++;
        }
    };

    const handleManualSearch = async () => {
        if (!selectedSystem || !selectedGame) return;
        setIsScraping(true);
        setStatus('Scraping Manual em Andamento...');
        statsRef.current = { success: 0, notFound: 0, error: 0 };
        
        const gameObj = games.find(g => g.fileName === selectedGame);
        await scrapeSingleGame(selectedSystem, gameObj);

        printSummary('🏁 Busca Manual Concluída');
        setStatus('Concluído.');
        setIsScraping(false);
    };

    const handleAutoScrape = async () => {
        if (!selectedSystem) return;
        setIsScraping(true);
        cancelRef.current = false;
        statsRef.current = { success: 0, notFound: 0, error: 0 };
        setStatus('Scraping Automático em Andamento...');
        setProgress({ current: 0, total: games.length });
        
        addLog(`🚀 Iniciando scraping de ${games.length} jogos para ${selectedSystem}`, 'info', true);
        
        for (let i = 0; i < games.length; i++) {
            setProgress({ current: i + 1, total: games.length });
            if (cancelRef.current) {
                printSummary('⚠️ Scraping Cancelado pelo Usuário');
                setStatus('Cancelado.');
                setIsScraping(false);
                setProgress({ current: 0, total: 0 });
                return;
            }
            await scrapeSingleGame(selectedSystem, games[i]);
            await delay(1000);
        }

        printSummary('🏁 Scraping Automático Concluído');
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
                                    {progress.current} / {progress.total}
                                </span>
                            )}
                            {status && (
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full animate-pulse">
                                    {status}
                                </span>
                            )}
                            {logs.length > 0 && !isScraping && (
                                <button
                                    onClick={() => setLogs([])}
                                    title="Limpar logs"
                                    className="text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    <RefreshCcw size={14} />
                                </button>
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
                                    log.type === 'error'   ? 'text-red-400' :
                                    log.type === 'success' ? 'text-green-400' :
                                    log.type === 'warning' ? 'text-yellow-400' :
                                    log.type === 'summary' ? 'text-purple-300 font-bold' :
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
