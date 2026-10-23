# Projectoverzicht

Zelfstandige SC Cambuur-site met de fonts en Eleventy-assetopbouw van de oorspronkelijke site; de vormgeving is sinds 20 oktober 2026 eigen (effen ondergrond, kaarten, tonen; zie [wedstrijden.md](wedstrijden.md#vormgeving-herzien-20-oktober-2026)). `src/scc/` bevat 40 Markdown-verslagen in twee seizoenen en 40 volledige, lokaal opgeslagen API-Football-responsen.

Het overzicht staat op `/`, met bovenaan een vertrekbord voor maximaal vijf komende wedstrijden. `src/scc/view/match.njk` genereert per verslag `/<datum>-<tegenstander>/`; `match-json.11ty.js` levert daarnaast `data.json`. De bronbestanden in `src/scc/<seizoen>/` krijgen zelf geen permalink. `src/scc/scc.11tydata.js` vormt de collectie en leest de gekoppelde lokale JSON met `src/lib/scc-matchdata.js`. De andere SCC-helpers maken de groepsindeling en het leesmodel; `scc-match-story.js` en `scc-archive.js` voeden de vormgeving, `src/includes/partials/scc/ui.njk` en `src/css/components/scc-ui.css` bevatten de bouwstenen. Builds benaderen API-Football niet.

`src/includes/layouts/base.njk` bevat de gedeelde paginabasis. `src/css/tw/` bevat tokens, basis en utilities; `src/css/pages/scc.css` de brede archiefopmaak. `src/js/core.js` start de tabtitel en, alleen op de stijlproeven (`grid: true`), het raster. Assets worden via `src/lib/assets.js` geregistreerd en krijgen een cacheversie. `src/data/site.js` bevat domein en plaats voor de dockklok.

Alle HTML-pagina's krijgen in `base.njk` `noindex, nofollow`. Netlify stuurt voor alle statische routes daarnaast `X-Robots-Tag: noindex, nofollow` via `netlify.toml`. `robots.txt` laat crawlers de pagina's ophalen zodat zij die instructie kunnen lezen. De site publiceert geen sitemap meer.

Het vertrekbord gebruikt bij de build `src/scc/upcoming.json` en vraagt in de browser `netlify/functions/scc-upcoming.mjs` om de actuele lijst uit Netlify Blobs. De geplande functie `scc-upcoming-refresh.mjs` leest na de eerstvolgende speeldag het officiële Cambuur-programma en ververst de opslag buiten builds om. Daarvoor is geen API-Football-sleutel nodig. De persoonlijke home, Instagram-koppeling en weerfunctie zijn niet in deze repo opgenomen. Basics, Typography en Components staan als lokaal design system op `/system/`, `/system/typography/` en `/system/components/`; de productiebuild slaat `src/system/` over. Netlify bouwt met `npm run build` naar `_site`; de agentcontrole schrijft via `npm run check:build` naar een tijdelijke map.

Sinds 21 oktober 2026 verrijkt `src/lib/scc-preview.js` het programma met
API-vorm, voorspellingen en (indien toegankelijk) ranglijstgegevens.
`src/scc/preview.json` is de lokale beginstand; `scc-preview-refresh.mjs`
ververst de sitebrede Blob dagelijks met maximaal drie API-verzoeken.
`src/lib/scc-football-api.js` blijft uitsluitend servercode. De homepage
heeft een breed donker voorbeschouwingspaneel en `Programma` eronder.

De homehero heeft datum en aftrap centraal boven de ploegen, duidelijke
thuis/uit-labels en een kleine aftelregel eronder. Onder 640px staat per
ploeg één regel met de vorm rechts naast de naam, zonder zichtbare labels. `Programma` is een
compacte gedempte lijst zonder vorm of stand; de eerstvolgende wedstrijd
houdt het meeste visuele gewicht.

De homehero en het wedstrijdbord liggen op een procedureel WebGL-voetbalveld
(`js/modules/scc/turf.js`, `css/components/scc-turf.css`): avondlicht vanaf
18:00 aftrap, anders middagschaduw. Zie [system.md](../paginas/system.md#voetbalgras-vergelijking).
