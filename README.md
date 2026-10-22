# scc.diederikdijkstra.nl

Wedstrijdarchief van SC Cambuur, gebouwd met Eleventy 3, Nunjucks, Tailwind CSS 4 en esbuild. De bronverslagen en volledige API-Football-responsen staan lokaal in `src/scc/`. Een build doet geen API-verzoeken.

## Ontwikkelen

```sh
npm install
npm run dev
```

`npm run check:build` bouwt ter controle naar een tijdelijke map. `npm test` draait de regressietests. De import van ontbrekende gespeelde wedstrijden loopt via `npm run scc:matchdata` en gebruikt lokaal `API_FOOTBALL_KEY` in `.env`. Het homepageprogramma komt van de officiële Cambuur-site en wordt op Netlify automatisch ververst; `npm run scc:upcoming` ververst de lokale momentopname wanneer de eerstvolgende speeldag voorbij is. Zie [API-Football en programma](docs/integraties/api-football.md).

## Indeling

- `src/scc/<seizoen>/`: verslagen; `src/scc/api/`: lokaal opgeslagen volledige API-responsen.
- `src/scc/view/`: overzicht op `/`, wedstrijdpagina's en `data.json`.
- `src/lib/scc-*.js`: lezen, controleren en presenteren van wedstrijddata.
- `src/css/`, `src/js/`, `src/includes/`: gedeelde mono-stijl en paginabasis.
- `src/system/`: lokale Basics- en Typography-proeven voor de gebruikte fonts en tekstrollen.
- `tools/scripts/`, `tools/tests/`: import, controlebuild en tests.
- `docs/`: [documentatie-index](docs/README.md).

De gepubliceerde site gebruikt `https://scc.diederikdijkstra.nl` als canonieke URL. GitHub- en Netlify-projectinstellingen worden buiten deze broncode ingesteld.
