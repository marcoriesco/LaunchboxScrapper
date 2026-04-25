'use client';
import { useState, useEffect } from 'react';
import { Save, Folder, CheckCircle, XCircle, Globe, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';

const KNOWN_REGIONS = [
    'North America', 'United States', 'Europe', 'World', 'Japan',
    'Brazil', 'Australia', 'France', 'Germany', 'Spain', 'Italy',
    'Korea', 'China', 'Russia', 'Netherlands', 'Scandinavia'
];

export default function SettingsPage() {
    const [config, setConfig] = useState(null);
    const [status, setStatus] = useState(null); // null | 'success' | 'error'
    const [message, setMessage] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        // Load config from Electron
        if (window.electronAPI) {
            window.electronAPI.getConfig().then(c => {
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
            // Validate path first
            const validation = await window.electronAPI.validateRetrobatPath(config.retrobatPath);
            if (!validation.valid) {
                setStatus('error');
                setMessage(validation.error);
                setIsValidating(false);
                return;
            }

            // Save config
            await window.electronAPI.saveConfig(config);
            setStatus('success');
            setMessage('Configurações salvas com sucesso!');
        } catch (e) {
            setStatus('error');
            setMessage('Erro ao salvar as configurações.');
        } finally {
            setIsValidating(false);
        }
    };

    if (!config) return <div className="p-8 text-center animate-pulse">Carregando configurações...</div>;

    return (
        <div className="max-w-3xl animate-[fadeIn_0.5s_ease-out]">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold mb-2">Configurações</h1>
                <p className="text-gray-400">Defina os caminhos e mapeamentos de pastas para o seu Launchbox Scraper.</p>
            </header>

            <div className="space-y-8">
                {/* Caminho do RetroBat */}
                <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Folder className="text-purple-400" /> Caminho do RetroBat
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                        A pasta raiz onde estão as pastas <code>/roms</code> e <code>/emulationstation/.emulationstation</code>.
                    </p>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={config.retrobatPath}
                            onChange={(e) => setConfig({ ...config, retrobatPath: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            placeholder="Ex: X:\RetroBat ou C:\Jogos\RetroBat"
                        />
                        <button
                            onClick={async () => {
                                const path = await window.electronAPI.selectDirectory();
                                if (path) setConfig({ ...config, retrobatPath: path });
                            }}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl transition-all whitespace-nowrap font-medium border border-gray-700"
                        >
                            Selecionar Pasta
                        </button>
                    </div>
                </div>

                {/* Tipos de Mídia */}
                <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-4">Mídias para Baixar</h2>
                    <p className="text-gray-400 text-sm mb-4">Selecione quais tipos de mídia deseja fazer o scrape. Futuramente, isso poderá ser feito por sistema.</p>
                    <div className="flex flex-col gap-3">
                        {['box3d', 'cover', 'screenshot', 'titlescreen', 'wheel', 'fanart', 'cartridge'].map(type => (
                            <div key={type} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                                <label className="flex items-center gap-3 cursor-pointer min-w-[150px]">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only" 
                                            checked={config.enabledMediaTypes?.[type] !== false}
                                            onChange={(e) => {
                                                const newEnabled = { ...(config.enabledMediaTypes || {}) };
                                                newEnabled[type] = e.target.checked;
                                                setConfig({ ...config, enabledMediaTypes: newEnabled });
                                            }}
                                        />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${(config.enabledMediaTypes?.[type] !== false) ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(config.enabledMediaTypes?.[type] !== false) ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="text-gray-300 capitalize font-medium">{type}</span>
                                </label>
                                
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-sm text-gray-500 hidden sm:block">Nome da pasta:</span>
                                    <input 
                                        type="text" 
                                        placeholder={`Padrão: ${type}`}
                                        value={config.customFolderNames?.[type] || ''}
                                        disabled={config.enabledMediaTypes?.[type] === false}
                                        onChange={(e) => {
                                            const newCustom = { ...(config.customFolderNames || {}) };
                                            newCustom[type] = e.target.value;
                                            setConfig({ ...config, customFolderNames: newCustom });
                                        }}
                                        className="w-full sm:max-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dev Mode */}
                <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h2 className="text-xl font-bold mb-2">Opções Avançadas</h2>

                    {/* Modo de Testes */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={config.devMode?.mediaTestsPath}
                                onChange={(e) => setConfig({
                                    ...config, 
                                    devMode: { ...config.devMode, mediaTestsPath: e.target.checked }
                                })}
                            />
                            <div className={`block w-14 h-8 rounded-full transition-colors ${config.devMode?.mediaTestsPath ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.devMode?.mediaTestsPath ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                        <div>
                            <span className="text-gray-300 block">Modo de Testes</span>
                            <span className="text-gray-500 text-xs">
                                Salvar mídias em <code className="bg-gray-800 px-1 py-0.5 rounded text-purple-300">MEDIA_TESTS/</code> ao invés da pasta original.
                            </span>
                        </div>
                    </label>

                    {/* Log Detalhado */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={config.verboseLog !== false}
                                onChange={(e) => setConfig({ ...config, verboseLog: e.target.checked })}
                            />
                            <div className={`block w-14 h-8 rounded-full transition-colors ${config.verboseLog !== false ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.verboseLog !== false ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                        <div>
                            <span className="text-gray-300 block">Log Detalhado</span>
                            <span className="text-gray-500 text-xs">
                                Exibe todos os logs no terminal. Desative para ver apenas sucessos, erros e o resumo final.
                            </span>
                        </div>
                    </label>

                    {/* Sobrescrever Imagens */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={config.overwriteExisting === true}
                                onChange={(e) => setConfig({ ...config, overwriteExisting: e.target.checked })}
                            />
                            <div className={`block w-14 h-8 rounded-full transition-colors ${config.overwriteExisting ? 'bg-orange-500' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.overwriteExisting ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                        <div>
                            <span className="text-gray-300 block">Sobrescrever Imagens Existentes</span>
                            <span className="text-gray-500 text-xs">
                                Se ativado, imagens já baixadas serão substituídas por novas. Se desativado, mídias existentes serão mantidas.
                            </span>
                        </div>
                    </label>
                </div>

                {/* Regiões Preferidas */}
                <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                        <Globe className="text-purple-400" size={20} /> Regiões Preferidas
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Ordem de prioridade para escolha das imagens. A região do topo é a preferida. 
                        Imagens sem região correspondente serão usadas como fallback.
                    </p>

                    <div className="flex flex-col gap-2 mb-3">
                        {(config.preferredRegions || []).map((region, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2">
                                <span className="text-xs text-purple-400 font-bold w-5 text-center">{idx + 1}</span>
                                <span className="flex-1 text-gray-200 text-sm">{region}</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={idx === 0}
                                        onClick={() => {
                                            const r = [...config.preferredRegions];
                                            [r[idx - 1], r[idx]] = [r[idx], r[idx - 1]];
                                            setConfig({ ...config, preferredRegions: r });
                                        }}
                                        className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
                                        title="Mover para cima"
                                    ><ChevronUp size={14} /></button>
                                    <button
                                        disabled={idx === config.preferredRegions.length - 1}
                                        onClick={() => {
                                            const r = [...config.preferredRegions];
                                            [r[idx + 1], r[idx]] = [r[idx], r[idx + 1]];
                                            setConfig({ ...config, preferredRegions: r });
                                        }}
                                        className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
                                        title="Mover para baixo"
                                    ><ChevronDown size={14} /></button>
                                    <button
                                        onClick={() => {
                                            const r = config.preferredRegions.filter((_, i) => i !== idx);
                                            setConfig({ ...config, preferredRegions: r });
                                        }}
                                        className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
                                        title="Remover"
                                    ><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <select
                            id="region-add-select"
                            defaultValue=""
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="">Adicionar região...</option>
                            {KNOWN_REGIONS
                                .filter(r => !(config.preferredRegions || []).includes(r))
                                .map(r => <option key={r} value={r}>{r}</option>)
                            }
                        </select>
                        <button
                            onClick={() => {
                                const sel = document.getElementById('region-add-select');
                                if (!sel.value) return;
                                const r = [...(config.preferredRegions || []), sel.value];
                                setConfig({ ...config, preferredRegions: r });
                                sel.value = '';
                            }}
                            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        >
                            <Plus size={14} /> Adicionar
                        </button>
                    </div>
                </div>

                {/* Status Messages */}
                {status && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 animate-[slideUp_0.3s_ease-out] ${status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {status === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        <span>{message}</span>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleSave}
                        disabled={isValidating}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
                    >
                        <Save size={20} />
                        {isValidating ? 'Validando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
