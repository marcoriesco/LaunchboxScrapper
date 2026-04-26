import { useEffect, useRef } from "react";

export type LogLevel = "info" | "success" | "warn" | "error" | "query" | "data";

export interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  message: string;
}

interface ExecutionTerminalProps {
  logs: LogEntry[];
  current: number;
  total: number;
  isRunning: boolean;
  etaSeconds: number | null;
}

const levelStyles: Record<LogLevel, string> = {
  info: "text-log-info",
  success: "text-log-success",
  warn: "text-log-warn",
  error: "text-log-error",
  query: "text-log-query",
  data: "text-foreground/70",
};

const levelLabel: Record<LogLevel, string> = {
  info: "INFO",
  success: "OK",
  warn: "WARN",
  error: "ERR",
  query: "QUERY",
  data: "DATA",
};

function formatEta(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function ExecutionTerminal({
  logs,
  current,
  total,
  isRunning,
  etaSeconds,
}: ExecutionTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const percent = total > 0 ? (current / total) * 100 : 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <aside className="w-full lg:w-[420px] lg:shrink-0 border-l border-border bg-background/60 backdrop-blur-2xl flex flex-col font-mono">
      {/* Header */}
      <div className="h-20 px-6 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans">
            Terminal de Execução
          </span>
          <span className="text-base font-medium text-foreground font-sans">
            Stream Output
          </span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest ${
            isRunning
              ? "border-secondary/40 bg-secondary/10 text-secondary"
              : "border-border bg-background/40 text-muted-foreground"
          }`}
        >
          <div
            className={`size-1.5 rounded-full ${
              isRunning ? "bg-secondary animate-pulse" : "bg-muted-foreground"
            }`}
          />
          {isRunning ? "Executando" : "Inativo"}
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 py-6 border-b border-border bg-background/40">
        <div className="flex justify-between items-end mb-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans">
              Progresso
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              ETA {formatEta(etaSeconds)}
            </span>
          </div>
          <div className="text-right tabular-nums">
            <span className="text-3xl text-primary font-bold">{current}</span>
            <span className="text-sm text-muted-foreground"> / {total}</span>
          </div>
        </div>

        <div className="h-2 w-full bg-background/80 rounded-full overflow-hidden border border-border relative">
          <div
            className="h-full bg-progress-gradient rounded-full relative overflow-hidden transition-[width] duration-500 ease-out shadow-glow-cyan"
            style={{ width: `${percent}%` }}
          >
            {isRunning && <div className="absolute inset-0 animate-shimmer" />}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-sans tabular-nums">
          <span>{percent.toFixed(1)}% concluído</span>
          <span>{total - current} restantes</span>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 text-[11px] leading-relaxed flex flex-col gap-1.5 min-h-0 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground/60 italic font-sans">
            Aguardando início da execução...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2.5 animate-fade-in">
              <span className="text-muted-foreground/60 shrink-0">
                [{log.time}]
              </span>
              <span className={`shrink-0 font-bold ${levelStyles[log.level]}`}>
                [{levelLabel[log.level]}]
              </span>
              <span className="text-foreground/80 break-words">
                {log.message}
              </span>
            </div>
          ))
        )}
        {isRunning && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground/60">{">"}</span>
            <span className="inline-block w-2 h-3.5 bg-primary animate-blink" />
          </div>
        )}
      </div>
    </aside>
  );
}
