const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const configManager = require('./configManager');

function getSystems() {
    const retrobatPath = configManager.getRetrobatPath();
    if (!retrobatPath) return { error: 'Caminho do Retrobat não configurado.' };

    const esPath = path.join(retrobatPath, 'emulationstation', '.emulationstation');
    
    if (!fs.existsSync(esPath)) {
        return { error: 'Pasta não encontrada: ' + esPath };
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
    });

    const systemsMap = new Map();

    // 1. Ler o arquivo base primeiro
    const baseFile = path.join(esPath, 'es_systems.cfg');
    if (fs.existsSync(baseFile)) {
        try {
            const xmlData = fs.readFileSync(baseFile, 'utf8');
            const parsed = parser.parse(xmlData);
            if (parsed && parsed.systemList && parsed.systemList.system) {
                const sysArray = Array.isArray(parsed.systemList.system) ? parsed.systemList.system : [parsed.systemList.system];
                sysArray.forEach(sys => {
                    if (sys && sys.name) systemsMap.set(sys.name, sys);
                });
            }
        } catch (e) {
            console.error('Erro ao ler es_systems.cfg', e);
        }
    } else {
        return { error: 'es_systems.cfg não encontrado no diretório: ' + esPath };
    }

    // 2. Ler todos os arquivos customizados (es_systems_*.cfg) e sobrescrever se necessário
    try {
        const files = fs.readdirSync(esPath);
        const customFiles = files.filter(f => f.startsWith('es_systems_') && f.endsWith('.cfg'));
        
        customFiles.forEach(file => {
            const customFilePath = path.join(esPath, file);
            try {
                const xmlData = fs.readFileSync(customFilePath, 'utf8');
                const parsed = parser.parse(xmlData);
                if (parsed && parsed.systemList && parsed.systemList.system) {
                    const sysArray = Array.isArray(parsed.systemList.system) ? parsed.systemList.system : [parsed.systemList.system];
                    sysArray.forEach(sys => {
                        if (sys && sys.name) {
                            // Sobrescreve o base ou adiciona um novo sistema
                            systemsMap.set(sys.name, sys);
                        }
                    });
                }
            } catch (e) {
                console.error(`Erro ao ler ${file}`, e);
            }
        });
    } catch (e) {
        console.error('Erro ao listar arquivos do diretório', e);
    }

    const allSystems = Array.from(systemsMap.values());

    // Filtrar apenas sistemas que possuem a pasta roms fisicamente
    const romsBasePath = path.join(retrobatPath, 'roms');
    const validSystems = allSystems.filter(sys => {
        if (!sys || !sys.path) return false;
        const sysFolder = path.join(romsBasePath, sys.name);
        return fs.existsSync(sysFolder);
    });

    const allSystemsMap = new Map(allSystems.map(sys => [sys.name, sys]));

    return validSystems.map(sys => {
        let launchboxPlatform = sys.fullname;
        if (sys.platform) {
            // Alguns sistemas tem multiplas platforms separadas por virgula, pegamos a primeira
            const platformKey = sys.platform.split(',')[0].trim();
            const baseSystem = allSystemsMap.get(platformKey);
            if (baseSystem && baseSystem.fullname) {
                launchboxPlatform = baseSystem.fullname;
            }
        }

        return {
            name: sys.name,
            fullname: sys.fullname,
            launchboxPlatform: launchboxPlatform,
            extension: sys.extension,
            path: sys.path
        };
    });
}

module.exports = {
    getSystems
};
