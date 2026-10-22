# Todo

- Dock en ticker (dock-specialist): de site is alleen nog donker, maar `ticker.css` gebruikt `dark:` (systeeminstelling). Bij `dock: true` op een licht systeem dus witte blokjes op zwart; afstemmen.
- De dock staat tijdelijk uit (`dock: false` in `src/data/site.js`, voorwaarde in `layouts/base.njk`). Terugzetten met `dock: true`; de dockbestanden zelf zijn ongewijzigd.
- Nieuwe vormgeving (20 oktober 2026) beoordelen: de drempels van de kerncijfertonen (balbezit 48–52%, xG ±0,75), afspeelduur van de wedstrijd op het bord (4 s), de vijf ratingbanden en -kleuren, en de veldoriëntatie (kolom 1 = linkerflank).
- Dock (dock-specialist): op wedstrijdpagina's wedstrijdinfo tonen uit `#scc-match-data` en `scc:moment`; op het overzicht de actieve wedstrijd uit `scc:match`. Het weer hoort er niet in. Zie [wedstrijden.md](../architectuur/wedstrijden.md#vormgeving-herzien-20-oktober-2026).
- De introtekst noemt alle officiële wedstrijden; `wedstrijden.md` noemde 2025/2026 eerder een selectie. Bevestigen dat de collectie compleet is.
- Een ranglijstverplaatsing pas tonen zodra betrouwbare historische standen beschikbaar zijn; de huidige fixture-JSON bevat die niet.
- GitHub-repo, Netlify-site en domeinkoppeling voor `scc.diederikdijkstra.nl` aanmaken en instellen. Deze externe instellingen staan niet in de broncode.
- Blessuretijd ontbreekt bij ADO Den Haag (19 sep), PEC Zwolle en AZ. Eventueel de importer een optie geven om gekoppelde wedstrijden opnieuw op te halen; API-Football kan `status.extra` achteraf vullen.
