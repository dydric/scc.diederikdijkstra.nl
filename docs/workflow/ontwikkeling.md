# Ontwikkelen en controleren

De gebruiker start `npm run dev`; agents starten geen dev-server of watcher. Vóór de server begint, draait eenmaal `npm run scc:new-reports`: die leest de officiële Cambuur-uitslagen, vergelijkt gespeelde competitie- en bekerduels van het huidige seizoen met de bestaande Markdown-bestanden en zet ontbrekende verslagen klaar. De terminal meldt elk nieuw bestand. Een los `npm run scc:new-reports` doet dezelfde controle. Bij netwerk- of bronfouten blijft `npm run dev` starten en verschijnt een waarschuwing; de controle wordt pas bij de volgende start herhaald. Nieuwe bestanden hebben een lege tekst en tonen op de site voorlopig `Verslag volgt nog.` Vul de Markdown-body zelf aan; voeg `matchdata` en eventueel `videoUrl` apart toe. Bestaande verslagen worden niet aangepast. `npm run check:build` maakt een productiebuild in een tijdelijke map en laat `_site` ongemoeid. `npm run check:build -- --development` bouwt zonder minificatie en neemt `/system/` en `/system/typography/` mee. De productiebuild slaat `src/system/` over. `npm test` draait de regressietests. Gebruik `npm run scc:matchdata` alleen voor bewust geïmporteerde ontbrekende wedstrijden. `npm run scc:upcoming` ververst de lokale programma-JSON pas na de eerstvolgende speeldag; Netlify doet de live verversing automatisch. Zie [API-Football en programma](../integraties/api-football.md).

Een gewone `npm run build` schrijft naar `_site` en is bedoeld voor Netlify of de gebruiker. Een push naar `main` kan publiceren; commits, pushes en deploys worden alleen op uitdrukkelijk verzoek gedaan. De GitHub-remote `origin` is `https://github.com/dydric/scc.diederikdijkstra.nl.git`.

Voor de voorbeschouwing: `npm run scc:matchdata -- preview` (maximaal drie
API-verzoeken, eenmaal per UTC-dag). Netlify ververst die gegevens apart
van het clubprogramma; zie de API-documentatie voor het Functions-secret
`API_FOOTBALL_KEY`, Free-beperkingen en de dagelijkse quotareserve.
