# Arquitetura do LaunchBox Scraper Desktop

A abordagem ideal, dado que você já tem lógica em Next.js (Node), é migrar as lógicas de sistema de arquivos e web scraping para o **Main Process** do Electron, e usar o Next.js estaticamente para a **Interface (Renderer)**. Isso evita precisar rodar um servidor web localmente na versão final em produção.

## 1. Estrutura de Pastas Sugerida

```text
/LaunchboxScrapper
├── app/                      # (Interface Next.js) UI e Componentes
│   ├── globals.css           # Tailwind e estilos globais
│   ├── layout.jsx
│   └── page.jsx              # Suas telas (Busca Manual, Configurações, etc)
│
├── electron/                 # ⚙️ Código do Backend (Node.js/Electron)
│   ├── main.js               # Ponto de entrada. Cria as janelas e gerencia o app
│   ├── preload.js            # "Ponte" (IPC). Expõe as funções do Node para o Next.js
│   └── services/             # Lógica pesada separada por módulos
│       ├── configManager.js  # Gerencia salvamento e leitura do config.json
│       ├── esParser.js       # Faz o parsing do es_systems.cfg e xml
│       ├── romManager.js     # Lista arquivos da pasta de ROMs e filtra extensões
│       ├── scraper.js        # Lógica do LaunchBox (Cheerio/Axios)
│       └── mediaDownloader.js# Salva os arquivos de imagem/vídeo nas pastas corretas
│
├── config.json               # ⚙️ Suas configurações e caminhos
├── package.json
└── next.config.mjs           # Configuraremos para 'output: export'
```

## 2. Bibliotecas Úteis Sugeridas

1. **`electron-store`** *(Configuração)*: Para gerenciar o arquivo `config.json` com segurança e facilidade. Ele lida bem com leitura/escrita síncrona/assíncrona de preferências de usuário.
2. **`fast-xml-parser`** ou **`xml2js`** *(Parsing XML)*: Muito mais rápidos e limpos para converter o `es_systems.cfg` em objetos JSON e extrair as tags `<platform>`.
3. **`axios` + `cheerio`** *(Scraping)*: Você já utiliza. São as melhores para este caso.
4. **`electron-is-dev`** + **`concurrently`**: Para rodar o ambiente de desenvolvimento (Next.js + Electron ao mesmo tempo).
5. **`lucide-react`**: Para ícones modernos e leves na interface (como as engrenagens de config e buscas).

## 3. Fluxo de Execução & IPC

Como Next.js exportado estaticamente não roda rotas de API `/api/...`, o fluxo funcionará através de **IPC (Inter-Process Communication)**:

1. **Usuário clica em "Salvar Caminho RetroBat"** na Interface (Next.js).
2. Interface chama: `window.electronAPI.saveConfig({ retrobatPath: 'X:/RetroBat' })`
3. O `preload.js` repassa essa chamada para o Electron Main.
4. O `main.js` intercepta, chama o `configManager.js` que valida a existência das pastas `/roms` e `/emulationstation` usando `fs.existsSync`.
5. O resultado (Sucesso ou Erro) volta para a Interface, que exibe um Toast/Alerta de sucesso.

## 4. Gerenciamento de Mídias (Modelagem e Pastas)

Como você solicitou o mapeamento `COVER - 3D → /media/cover`, a modelagem no seu `config.json` ficará parecida com isto:

```json
{
  "retrobatPath": "X:/RetroBat",
  "mediaMapping": {
    "COVER - 3D": "cover",
    "SCREENSHOT": "screenshot",
    "VIDEO": "video"
  },
  "devMode": {
    "mediaTestsPath": true  // Salva em /roms/{plataforma}/MEDIA_TESTS/ ao invés da raiz
  }
}
```

## 5. Estratégia de Scraping Eficiente (Boas Práticas)

- **Controle de Concorrência**: Não fazer download de todas as imagens de uma vez para não travar o app e não tomar ban de IP do LaunchBox. Usar um _Queue_ (Fila) que faça requests com atrasos (ex: 3 jogos por vez, delay de 100ms).
- **Validação de Hash/Tamanho**: Se for baixar e o arquivo já existir com o tamanho esperado, pular para não perder tempo.
- **Armazenamento Temporário**: Baixar em um arquivo `.tmp` e renomear quando terminar. Evita imagens corrompidas se o app for fechado no meio.
