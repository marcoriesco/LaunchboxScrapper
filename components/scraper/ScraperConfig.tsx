import { Search, Play, Square, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ScraperConfigProps {
  isRunning: boolean;
  onToggle: () => void;
  onManualScrape: () => void;
  platform: string;
  onPlatformChange: (v: string) => void;
  game: string;
  onGameChange: (v: string) => void;
  selectedAssets: string[];
  onToggleAsset: (asset: string) => void;
  systems: any[];
  games: any[];
}

const ASSET_TYPES = [
  { id: "boxart", label: "Box Art", color: "primary" },
  { id: "logo", label: "Clear Logo", color: "secondary" },
  { id: "video", label: "Vídeo", color: "accent" },
  { id: "screenshot", label: "Screenshots", color: "primary" },
  { id: "manual", label: "Manual", color: "secondary" },
  { id: "fanart", label: "Fanart", color: "accent" },
];

export function ScraperConfig({
  isRunning,
  onToggle,
  onManualScrape,
  platform,
  onPlatformChange,
  game,
  onGameChange,
  selectedAssets,
  onToggleAsset,
  systems,
  games,
}: ScraperConfigProps) {
  return (
    <div className="glass-panel rounded-3xl p-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform */}
        <div className="flex flex-col gap-3">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">
            Plataforma <span className="text-secondary">*</span>
          </label>
          <Select value={platform} onValueChange={onPlatformChange}>
            <SelectTrigger className="glass-input h-14 rounded-xl text-sm font-medium text-foreground [&>svg]:text-muted-foreground">
              <SelectValue placeholder="Selecione uma plataforma" />
            </SelectTrigger>
            <SelectContent className="glass-panel border-border max-h-[300px]">
              {systems.map((s) => (
                <SelectItem key={s.name} value={s.name} className="font-medium">
                  {s.fullname} ({s.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Game */}
        <div className="flex flex-col gap-3">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">
            Jogo (opcional)
          </label>
          <Select value={game} onValueChange={onGameChange}>
            <SelectTrigger className="glass-input h-14 rounded-xl text-sm font-medium text-foreground [&>svg]:text-muted-foreground">
              <SelectValue placeholder="Todos os jogos" />
            </SelectTrigger>
            <SelectContent className="glass-panel border-border max-h-[300px]">
              <SelectItem value="all" className="font-medium">
                Todos os jogos ({games.length})
              </SelectItem>
              {games.map((g) => (
                <SelectItem key={g.fileName} value={g.fileName} className="font-medium">
                  {g.searchName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Asset chips */}
      <div className="mt-8 flex flex-col gap-3">
        <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">
          Tipos de mídia
        </label>
        <div className="flex flex-wrap gap-2.5">
          {ASSET_TYPES.filter(a => selectedAssets.includes(a.id)).map((a) => {
            const colorClasses = 
                a.color === "primary"
                ? "border-primary/60 bg-primary/10 text-primary shadow-glow-cyan"
                : a.color === "secondary"
                ? "border-secondary/60 bg-secondary/10 text-secondary shadow-glow-pink"
                : "border-accent/60 bg-accent/10 text-accent shadow-glow-purple";
            return (
              <div
                key={a.id}
                className={`px-4 py-2 rounded-full border text-sm transition-all duration-200 ${colorClasses}`}
              >
                {a.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-stretch gap-3">
        <Button
          variant="outline"
          onClick={onManualScrape}
          disabled={!platform || game === "all" || isRunning}
          className="flex-1 h-14 rounded-xl glass-input border-border bg-background/30 hover:bg-background/60 text-foreground font-medium gap-2 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Busca Manual
        </Button>

        <button
          onClick={onToggle}
          disabled={!platform}
          className="flex-[2] h-14 rounded-xl relative p-[1px] overflow-hidden group disabled:opacity-50"
        >
          <div
            className={`absolute inset-0 rounded-xl transition-opacity ${
              isRunning
                ? "bg-gradient-to-r from-destructive via-secondary to-destructive opacity-90"
                : "bg-gradient-button opacity-90 group-hover:opacity-100"
            }`}
          />
          <div className="relative h-full bg-background rounded-[10px] flex items-center justify-center gap-2.5 transition-colors group-hover:bg-background/80">
            {isRunning ? (
              <>
                <Square className="h-4 w-4 fill-current text-secondary" />
                <span className="font-semibold text-foreground tracking-wide">
                  Parar Scrape
                </span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current text-primary" />
                <span className="font-semibold text-foreground tracking-wide">
                  Iniciar Scrape
                </span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
