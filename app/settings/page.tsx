'use client';

import { useState, useEffect } from 'react';
import { 
  Save, Folder, CheckCircle, XCircle, Globe, 
  ChevronUp, ChevronDown, Plus, Trash2,
  Settings as SettingsIcon,
  Layout, 
  PlaySquare
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const KNOWN_REGIONS = [
    'North America', 'United States', 'Europe', 'World', 'Japan',
    'Brazil', 'Australia', 'France', 'Germany', 'Spain', 'Italy',
    'Korea', 'China', 'Russia', 'Netherlands', 'Scandinavia'
];

export default function SettingsPage() {
    const [config, setConfig] = useState<any>(null);
    const [status, setStatus] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        if ((window as any).electronAPI) {
            (window as any).electronAPI.getConfig().then((c: any) => {
                setConfig(c);
            });
        }
    }, []);

    const handleSave = async () => {
        if (!config.retrobatPath) {
            setStatus('error');
            setMessage('O caminho do RetroBat não pode estar vazio.');
            return;
        }

        setIsValidating(true);
        setStatus(null);
        
        try {
            const validation = await (window as any).electronAPI.validateRetrobatPath(config.retrobatPath);
            if (!validation.valid) {
                setStatus('error');
                setMessage(validation.error);
                setIsValidating(false);
                return;
            }

            await (window as any).electronAPI.saveConfig(config);
            setStatus('success');
            setMessage('Configurações salvas com sucesso!');
        } catch (e) {
            setStatus('error');
            setMessage('Erro ao salvar as configurações.');
        } finally {
            setIsValidating(false);
        }
    };

    if (!config) return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">Carregando configurações...</span>
            </div>
        </div>
    );

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-20 px-6 lg:px-10 flex items-center justify-between border-b border-border bg-background/40 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground tracking-tight">
                                    Configurações
                                </h1>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    Ajuste os caminhos e preferências do scraper
                                </p>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                            
                            {/* RetroBat Path */}
                            <section className="glass-panel rounded-3xl p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <Folder className="size-5" />
                                    </div>
                                    <h2 className="text-lg font-semibold tracking-tight">Diretório do RetroBat</h2>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Aponte para a pasta raiz onde estão localizadas as suas ROMS e arquivos do EmulationStation.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                        <Input 
                                            value={config.retrobatPath}
                                            onChange={(e) => setConfig({ ...config, retrobatPath: e.target.value })}
                                            placeholder="Ex: X:\RetroBat"
                                            className="glass-input h-12 rounded-xl"
                                        />
                                    </div>
                                    <Button 
                                        variant="outline"
                                        className="h-12 rounded-xl px-6 border-border hover:bg-background/40"
                                        onClick={async () => {
                                            const path = await (window as any).electronAPI.selectDirectory();
                                            if (path) setConfig({ ...config, retrobatPath: path });
                                        }}
                                    >
                                        Selecionar
                                    </Button>
                                </div>
                            </section>

                            {/* Media Types */}
                            <section className="glass-panel rounded-3xl p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                                        <Layout className="size-5" />
                                    </div>
                                    <h2 className="text-lg font-semibold tracking-tight">Tipos de Mídia</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['cover3d', 'cover2d', 'screenshot', 'titlescreen', 'wheel', 'fanart', 'cartridge', 'video'].map(type => (
                                        <div key={type} className="flex items-center justify-between p-4 rounded-2xl bg-background/30 border border-border/50">
                                            <div className="flex flex-col gap-1">
                                                <Label htmlFor={`switch-${type}`} className="text-sm font-medium capitalize cursor-pointer">
                                                    {type === 'wheel' ? 'Clear Logo' : type}
                                                </Label>
                                                <Input 
                                                    className="h-8 text-[10px] w-32 glass-input border-none bg-transparent p-0 focus-visible:ring-0"
                                                    placeholder={`Pasta: ${type}`}
                                                    value={config.customFolderNames?.[type] || ''}
                                                    onChange={(e) => {
                                                        const newCustom = { ...(config.customFolderNames || {}) };
                                                        newCustom[type] = e.target.value;
                                                        setConfig({ ...config, customFolderNames: newCustom });
                                                    }}
                                                />
                                            </div>
                                            <Switch 
                                                id={`switch-${type}`}
                                                checked={config.enabledMediaTypes?.[type] !== false}
                                                onCheckedChange={(checked) => {
                                                    const newEnabled = { ...(config.enabledMediaTypes || {}) };
                                                    newEnabled[type] = checked;
                                                    setConfig({ ...config, enabledMediaTypes: newEnabled });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Advanced Options */}
                            <section className="glass-panel rounded-3xl p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-accent/10 text-accent">
                                        <SettingsIcon className="size-5" />
                                    </div>
                                    <h2 className="text-lg font-semibold tracking-tight">Opções Avançadas</h2>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Video Duration */}
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium">Duração dos vídeos</Label>
                                            <p className="text-xs text-muted-foreground">Tempo máximo para o corte do YouTube (segundos)</p>
                                        </div>
                                        <Input 
                                            type="number"
                                            className="w-20 glass-input h-10 rounded-lg text-center"
                                            value={config.videoDuration || 20}
                                            onChange={(e) => setConfig({ ...config, videoDuration: parseInt(e.target.value) || 20 })}
                                        />
                                    </div>

                                    <div className="h-px bg-border/50" />

                                    {/* Switches */}
                                    {[
                                        { 
                                            label: "Modo de Testes", 
                                            desc: "Salva em MEDIA_TESTS/ ao invés da pasta original",
                                            checked: !!config.devMode?.mediaTestsPath,
                                            onChange: (v: boolean) => setConfig({ ...config, devMode: { ...config.devMode, mediaTestsPath: v } })
                                        },
                                        { 
                                            label: "Log Detalhado", 
                                            desc: "Exibe todos os detalhes técnicos no terminal",
                                            checked: config.verboseLog !== false,
                                            onChange: (v: boolean) => setConfig({ ...config, verboseLog: v })
                                        },
                                        { 
                                            label: "Sobrescrever", 
                                            desc: "Substituir mídias que já existem no disco",
                                            checked: !!config.overwriteExisting,
                                            onChange: (v: boolean) => setConfig({ ...config, overwriteExisting: v })
                                        }
                                    ].map((opt, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium">{opt.label}</Label>
                                                <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                            </div>
                                            <Switch checked={opt.checked} onCheckedChange={opt.onChange} />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Preferred Regions */}
                            <section className="glass-panel rounded-3xl p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <Globe className="size-5" />
                                    </div>
                                    <h2 className="text-lg font-semibold tracking-tight">Prioridade de Regiões</h2>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Mova as regiões para definir a prioridade de escolha das mídias.
                                </p>

                                <div className="space-y-2">
                                    {(config.preferredRegions || []).map((region: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-background/30 border border-border/50 group">
                                            <span className="text-[10px] font-bold text-primary/60 w-4">{idx + 1}</span>
                                            <span className="flex-1 text-sm font-medium">{region}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="size-8" disabled={idx === 0} onClick={() => {
                                                    const r = [...config.preferredRegions];
                                                    [r[idx - 1], r[idx]] = [r[idx], r[idx - 1]];
                                                    setConfig({ ...config, preferredRegions: r });
                                                }}>
                                                    <ChevronUp className="size-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="size-8" disabled={idx === config.preferredRegions.length - 1} onClick={() => {
                                                    const r = [...config.preferredRegions];
                                                    [r[idx + 1], r[idx]] = [r[idx], r[idx + 1]];
                                                    setConfig({ ...config, preferredRegions: r });
                                                }}>
                                                    <ChevronDown className="size-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={() => {
                                                    const r = config.preferredRegions.filter((_: any, i: number) => i !== idx);
                                                    setConfig({ ...config, preferredRegions: r });
                                                }}>
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        id="region-add-select"
                                        className="flex-1 h-10 rounded-xl glass-input bg-background/50 px-4 text-sm"
                                        defaultValue=""
                                    >
                                        <option value="">Adicionar região...</option>
                                        {KNOWN_REGIONS
                                            .filter(r => !(config.preferredRegions || []).includes(r))
                                            .map(r => <option key={r} value={r}>{r}</option>)
                                        }
                                    </select>
                                    <Button 
                                        variant="outline" 
                                        className="h-10 rounded-xl px-4"
                                        onClick={() => {
                                            const sel = document.getElementById('region-add-select') as HTMLSelectElement;
                                            if (!sel.value) return;
                                            const r = [...(config.preferredRegions || []), sel.value];
                                            setConfig({ ...config, preferredRegions: r });
                                            sel.value = '';
                                        }}
                                    >
                                        <Plus className="size-4 mr-2" /> Adicionar
                                    </Button>
                                </div>
                            </section>

                            {/* Status and Actions */}
                            <div className="flex items-center justify-between pt-6">
                                <div>
                                    {status && (
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium animate-slide-up",
                                            status === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                                        )}>
                                            {status === 'success' ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                                            {message}
                                        </div>
                                    )}
                                </div>
                                <Button 
                                    className="h-14 px-10 rounded-2xl bg-gradient-button shadow-glow-cyan text-foreground font-bold hover:opacity-90 transition-opacity"
                                    disabled={isValidating}
                                    onClick={handleSave}
                                >
                                    <Save className="size-5 mr-2" />
                                    {isValidating ? 'Validando...' : 'Salvar Configurações'}
                                </Button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
