# Launchbox Web Scraper (Next.js)

Um projeto Next.js criado para mapear os sistemas do EmulationStation (`es_systems.cfg`) com o banco de dados do Launchbox.
O Scraper acessa as páginas das plataformas no Launchbox, obtém a lista de jogos e suas imagens, e apresenta tudo através de uma interface web estética e moderna com suporte a filtros locais. Além disso, você pode clicar no jogo para ver detalhes e futuramente baixar as imagens.

## Tecnologias Utilizadas
- **Framework:** Next.js (App Router), React.
- **Backend:** Next.js API Routes, Axios (para requisições), Cheerio (para parsing de HTML).
- **Frontend:** Vanilla CSS (com estética Glassmorphism e Dark Mode).

## Como Usar

1. **Inicie o servidor local:**
   Abra o terminal e execute:
   ```bash
   npm run dev
   ```

2. **Acesse a interface:**
   Abra o seu navegador em: [http://localhost:3000](http://localhost:3000)

3. **Como funciona a pesquisa e detalhes:**
   - Selecione a plataforma (ex: `snes`) e clique em "Load Games".
   - Digite no campo "Search Game" para filtrar instantaneamente os jogos.
   - **Clique em um jogo** para abrir a página de detalhes dele, onde as imagens (capa frontal, logos, etc.) podem ser extraídas e salvas.

## Editando o Mapeamento
O arquivo `mapping.json` guarda o link entre o nome do sistema e a URL oficial da plataforma no site do Launchbox. Você pode editar este arquivo manualmente para adicionar ou corrigir plataformas.

Exemplo:
```json
"snes": "https://gamesdb.launchbox-app.com/platforms/games/53-super-nintendo-entertainment-system",
"megadrive": "https://gamesdb.launchbox-app.com/platforms/games/23-sega-genesis"
```
