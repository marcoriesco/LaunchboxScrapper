'use client';
import { useState, useEffect } from 'react';
import { Save, Folder, CheckCircle, XCircle } from 'lucide-react';

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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {['box3d', 'cover', 'screenshot', 'titlescreen', 'wheel', 'fanart', 'cartridge'].map(type => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer">
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
                                <span className="text-gray-300 capitalize">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Dev Mode */}
                <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-4">Modo de Testes</h2>
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
                        <span className="text-gray-300">
                            Salvar mídias em <code className="bg-gray-800 px-2 py-1 rounded text-sm text-purple-300">MEDIA_TESTS/</code> ao invés de substituir os originais.
                        </span>
                    </label>
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
