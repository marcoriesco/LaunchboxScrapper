'use client';

import { useEffect, useRef, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScraperConfig } from "@/components/scraper/ScraperConfig";
import {
  ExecutionTerminal,
  type LogEntry,
  type LogLevel,
} from "@/components/scraper/ExecutionTerminal";

function nowTime() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export default function ScraperPage() {
  const [systems, setSystems] = useState<any[]>([]);
  const [platform, setPlatform] = useState("");
  
  const [games, setGames] = useState<any[]>([]);
  const [game, setGame] = useState("all");
  
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [verboseLog, setVerboseLog] = useState(true);

  const startRef = useRef<number | null>(null);
  const idRef = useRef(0);
  const cancelRef = useRef(false);
  const statsRef = useRef({ success: 0, notFound: 0, error: 0 });

  const addLog = (level: LogLevel, message: string, force = false) => {
    if (!force && !verboseLog && level === 'info') return;
    setLogs((prev) => {
      const next = [
        ...prev,
        { id: ++idRef.current, time: nowTime(), level, message },
      ];
      return next.slice(-200);
    });
  };

  useEffect(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.getSystems().then((res: any) => {
        if (!res.error) {
          setSystems(res.sort((a: any, b: any) => a.fullname.localeCompare(b.fullname)));
        } else {
          addLog("error", 'Erro ao carregar sistemas: ' + res.error, true);
        }
      });
      (window as any).electronAPI.getConfig().then((c: any) => {
          setVerboseLog(c?.verboseLog !== false);
          if (c && c.enabledMediaTypes) {
            const types = Object.keys(c.enabledMediaTypes).filter(k => c.enabledMediaTypes[k]);
            setSelectedAssets(types);
          }
      });
    }
  }, []);

  useEffect(() => {
    if (platform && (window as any).electronAPI) {
      setGames([]);
      setGame("all");
      (window as any).electronAPI.getGamesFromFolder(platform).then((res: any) => {
        if (!res.error) {
          setGames(res.sort((a: any, b: any) => a.searchName.localeCompare(b.searchName)));
        } else {
          addLog("error", res.error, true);
        }
      });
    }
  }, [platform]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const printSummary = (label: string) => {
    const { success, notFound, error } = statsRef.current;
    const tot = success + notFound + error;
    addLog('info', '─'.repeat(50), true);
    addLog('info', `${label}`, true);
    addLog('info', `📊 Total processados : ${tot}`, true);
    addLog('success', `✅ Sucesso           : ${success}`, true);
    addLog('warn', `🔍 Não encontrados   : ${notFound}`, true);
    addLog('error', `❌ Erros             : ${error}`, true);
    addLog('info', '─'.repeat(50), true);
  };

  const scrapeSingleGame = async (system: string, gameObj: any) => {
    const alreadyExists = await (window as any).electronAPI.checkMediaExists({ systemName: system, gameFileName: gameObj.fileName });
    if (alreadyExists) {
        addLog('success', `⏭️ Pulado: ${gameObj.searchName} (Mídia já existe)`, true);
        statsRef.current.success++;
        return;
    }

    const queryName = gameObj.cleanSearchName || gameObj.searchName;
    addLog('query', `Iniciando busca para: ${gameObj.searchName}${queryName !== gameObj.searchName ? ` (pesquisando: "${queryName}")` : ''}`);

    const sysObj = systems.find(s => s.name === system);
    const platformName = sysObj ? sysObj.launchboxPlatform : system;

    let media: any[] = [];
    let finalMatch = null;

    const dbResults = await (window as any).electronAPI.dbSearchGame({ query: queryName, platformName });
    
    if (dbResults.error) {
        addLog('warn', `⚠️ DB Local erro: ${dbResults.error}`);
    }
    
    if (!dbResults.error && dbResults.length > 0) {
        finalMatch = dbResults[0];
        if (dbResults.length > 1) {
            const normalize = (str: string) => str.replace(/\([^)]*\)|\[[^\]]*\]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedQuery = normalize(queryName);
            const exactMatch = dbResults.find((r: any) => normalize(r.title) === normalizedQuery);
            if (exactMatch) finalMatch = exactMatch;
        }
        
        addLog('info', `🔗 DB Local: ${finalMatch.title} (ID: ${finalMatch.databaseId})`);

        const dbImages = await (window as any).electronAPI.dbGetImages(finalMatch.databaseId);
        if (!dbImages.error && dbImages.length > 0) {
            media = dbImages;
        }
    }

    if (media.length === 0) {
        addLog('info', `🌐 Banco local sem resultado, buscando online...`);
        
        const searchResults = await (window as any).electronAPI.launchboxSearchGame({ query: queryName, platformName });
        if (searchResults.error || searchResults.length === 0) {
            addLog('error', `❌ Não encontrado: "${queryName}"`, true);
            statsRef.current.notFound++;
            return;
        }

        finalMatch = searchResults[0];
        if (searchResults.length > 1) {
            const normalize = (str: string) => str.replace(/\([^)]*\)|\[[^\]]*\]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedQuery = normalize(queryName);
            const exactMatch = searchResults.find((r: any) => normalize(r.title) === normalizedQuery);
            if (exactMatch) finalMatch = exactMatch;
        }
        
        addLog('info', `🔗 Online: ${finalMatch.title}`);

        const onlineMedia = await (window as any).electronAPI.launchboxScrapeGame(finalMatch.url);
        if (!onlineMedia.error && onlineMedia.length > 0) {
            media = onlineMedia;
        }
    }

    if (media.length === 0) {
        addLog('warn', `⚠️ Sem mídia: ${gameObj.searchName}`, true);
        statsRef.current.notFound++;
        return;
    }

    addLog('info', `⬇️ Encontradas ${media.length} imagens para ${gameObj.searchName}...`);

    const downloadResult = await (window as any).electronAPI.downloadMedia({
        systemName: system,
        gameFileName: gameObj.fileName,
        mediaImages: media,
        videoUrl: finalMatch ? finalMatch.videoUrl : null
    });

    if (downloadResult.error) {
        addLog('error', `❌ Erro no download: ${downloadResult.error}`, true);
        statsRef.current.error++;
    } else {
        const successCount = downloadResult.filter((d: any) => d.status === 'downloaded' || d.status === 'exists').length;
        addLog('success', `✅ ${gameObj.searchName} — ${successCount} mídia(s) salva(s)`, true);
        statsRef.current.success++;
    }
  };

  const handleManualSearch = async () => {
    if (!platform || game === "all") return;
    setIsRunning(true);
    statsRef.current = { success: 0, notFound: 0, error: 0 };
    setTotal(1);
    setCurrent(0);
    startRef.current = Date.now();
    
    const gameObj = games.find(g => g.fileName === game);
    await scrapeSingleGame(platform, gameObj);
    setCurrent(1);

    printSummary('🏁 Busca Manual Concluída');
    setIsRunning(false);
  };

  const handleAutoScrape = async () => {
    if (!platform) return;
    setIsRunning(true);
    cancelRef.current = false;
    statsRef.current = { success: 0, notFound: 0, error: 0 };
    setTotal(games.length);
    setCurrent(0);
    startRef.current = Date.now();
    
    addLog('info', `🚀 Iniciando scraping de ${games.length} jogos para ${platform}`, true);
    
    for (let i = 0; i < games.length; i++) {
        if (cancelRef.current) {
            printSummary('⚠️ Scraping Cancelado pelo Usuário');
            setIsRunning(false);
            return;
        }
        await scrapeSingleGame(platform, games[i]);
        setCurrent(i + 1);
        await delay(1000);
    }

    printSummary('🏁 Scraping Automático Concluído');
    setIsRunning(false);
  };

  const handleToggle = () => {
    if (isRunning) {
      cancelRef.current = true;
      setIsRunning(false);
      addLog("error", "Execução interrompida pelo usuário.", true);
      return;
    }
    if (current >= games.length) {
      setCurrent(0);
      setLogs([]);
    }
    handleAutoScrape();
  };

  const handleToggleAsset = async (asset: string) => {
    const next = selectedAssets.includes(asset) 
        ? selectedAssets.filter((a) => a !== asset) 
        : [...selectedAssets, asset];
    setSelectedAssets(next);

    // Save to config via IPC
    const config = await (window as any).electronAPI.getConfig() || {};
    if (!config.enabledMediaTypes) config.enabledMediaTypes = {};
    
    // reset all known types then apply next
    const allKnown = ["boxart", "logo", "video", "screenshot", "manual", "fanart"]; // from ScraperConfig
    allKnown.forEach(a => config.enabledMediaTypes[a] = false);
    next.forEach(a => config.enabledMediaTypes[a] = true);
    
    await (window as any).electronAPI.saveConfig(config);
  };

  const elapsed = startRef.current ? (Date.now() - startRef.current) / 1000 : 0;
  const rate = elapsed > 0 && current > 0 ? current / elapsed : 0;
  const etaSeconds = isRunning && rate > 0 ? Math.round((total - current) / rate) : null;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />

        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
          {/* Main content */}
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-20 px-6 lg:px-10 flex items-center justify-between border-b border-border bg-background/40 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                <div>
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">
                    Scraper
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Selecione uma plataforma para buscar e baixar as mídias
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-md">
                <div className="size-2 rounded-full bg-primary shadow-glow-cyan animate-pulse" />
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest">
                  Conectado
                </span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
              <div className="max-w-3xl mx-auto">
                <ScraperConfig
                  isRunning={isRunning}
                  onToggle={handleToggle}
                  onManualScrape={handleManualSearch}
                  platform={platform}
                  onPlatformChange={setPlatform}
                  game={game}
                  onGameChange={setGame}
                  selectedAssets={selectedAssets}
                  onToggleAsset={handleToggleAsset}
                  systems={systems}
                  games={games}
                />

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <StatCard label="Total Jogos" value={games.length.toString()} accent="primary" />
                  <StatCard label="Processados" value={current.toString()} accent="secondary" />
                  <StatCard label="Taxa" value={rate > 0 ? `${(1/rate).toFixed(1)}/s` : "0/s"} accent="accent" />
                </div>
              </div>
            </div>
          </main>

          <ExecutionTerminal
            logs={logs}
            current={current}
            total={total}
            isRunning={isRunning}
            etaSeconds={etaSeconds}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "primary" | "secondary" | "accent" }) {
  const accentMap = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${accentMap[accent]}`}>
        {value}
      </div>
    </div>
  );
}
