# Lokaal design system

`/system/` toont Basics: de gebruikte kleuren en drie beschikbare fonts. Op de SCC-pagina's draagt PP Neue Montreal de gewone tekst, JetBrains Mono de kleine labels en waarden tot circa 14px, en Space Mono de grotere data, aftelklok en uitslagen. Space Mono Regular en Bold staan als lokale woff2-bestanden naast de OFL-licentie. De fontbestanden staan in `src/assets/fonts/`; `src/css/tw/base/fonts.css` meldt ze aan. De overgebleven `font-pixel`-utility gebruikt JetBrains Mono voor de bestaande bordcellen. `src/js/pages/system.js` meet de werkelijk gerenderde fontgrootte, regelhoogte en tracking na het laden van de fonts.

`/system/typography/` toont de gedeelde tekstrollen, een Markdownproef en Montreal en JetBrains Mono op één basislijn boven het 8px-raster. De brede werkruimte en tabellen komen uit `src/css/pages/system.css`; de codevoorbeelden gebruiken `src/css/components/code.css` en de macro's in `src/includes/partials/system/`.

`/system/components/` toont de SCC-bouwstenen met echte data (de laatste wedstrijd en het archief): eerst de primitieven en tonen (chips per `data-tone`, cijfertegels met meter, de terminalregel en klaptegels), dan score, rapportcijfer en legenda, uitslag en vorm, de scorekaart als vertrekbord met het verloop, kerncijfers en doelpunten, teamcijfers, veld met rapportcijfers en het kwartierprofiel. Alleen de stijlproeven tonen nog het meetraster (`grid: true`); de SCC-pagina's hebben een effen ondergrond. De macro's staan in `src/includes/partials/scc/ui.njk`, de opmaak in `src/css/components/scc-ui.css`.

De SCC-scorekaart toont Space Mono Bold op 88/132px, de mobiele score op 44px en de archiefrijen op 22/30px. Kleine data, labels en tags staan in JetBrains Mono voor een scherper beeld; grotere waarden, belangrijke cijfers en de aftelklok in Space Mono. `--scc-blue` en `--opp` staan in `theme/colors.css`.

De navigatie toont Basics, Typography, Components en Voetbalgras. Deze pagina's zijn lokaal en staan niet in de productiebuild, sitemap of zoekindex. Bouw ze ter controle met `npm run check:build -- --development` naar een tijdelijke map.


## Voetbalgras (vergelijking)

Sinds 22 oktober 2026 staat het voetbalveld op de homehero en het
wedstrijdbord. `/system/grass/` blijft de lokale vergelijking: dezelfde
module en CSS, met knoppen voor gras aan/uit, stadionlicht, lichtmoment,
opnieuw afspelen, veldverlichting en de hoogtetest. De home gebruikt hier
een kopie van de hero-opmaak met opgeslagen programmadata, zonder live
verversing of aftelklok; de detailproef gebruikt de `board`-macro.

De motor is `js/modules/scc/turf.js` (functie `turf(panels)`), de opmaak
`css/components/scc-turf.css` (asset `scc-turf`, klasse `scc-turf` op
`.scc-upcoming-main` of `.scc-board`, met `data-turf` en `data-kickoff`).
Let op: `scc-pitch` is het bestaande opstellingsveld; het grasveld heet
daarom `turf`. De opstelling gebruikt de motor ook, met `data-turf-view="half"` op
`.scc-pitch-ground`. Home start het veld in `scc-upcoming.js` en werkt aftrap en
namen bij na het verversen van het programma; detail start het in
`scc-match.js` via `board(data, view, story, true, "detail")`.

Het gras is een gedeelde, procedurele 2048px-textuur (aangemaakt zodra de
browser even vrij is) met maaibanen en belijning op basis van 105 × 68
meter, via WebGL. Er is geen muisbeweging of doorlopende renderlus. De
renderresolutie volgt maximaal 2× de CSS-maat, begrensd op 2560 × 4096
pixels. Tot de eerste render staat de effen grondkleur; daarna komt het
veld in 300ms op. `assets/scc/pitch.svg` is de reserve zonder JS
(`@media (scripting: none)`) of zonder WebGL (`data-turf-static`, ook na
contextverlies). Het veld verandert de hoogte van de hero niet.

Het veld vult de hero met behoud van verhoudingen: brede hero's snijden
boven/onder bij, hoge hero's links/rechts. Daardoor ontstaat bij veel
doelpunten geen extra uitloopgras boven of onder het veld. De hoogtetest
herhaalt de doelpuntregels viermaal, met een expliciete melding dat dit
geen echte wedstrijddata is. De knoppen vergelijken de huidige achtergrond
en regelen de verlichting. De proef staat buiten de productiebuild.


### Stadionlicht en lichtmoment

Het licht wordt in de shader berekend en beschijnt het gras zelf. Negen
lampen hangen buiten beeld achter de onderrand van de timeline (de
voorspellingsbalk op home, de standkleuren op detail). Er zijn geen
hoekbronnen of diagonale bundels meer, dus ook geen kruispatroon op
smalle schermen. Het lichtniveau is per breedte genormaliseerd. Zachte
bundels waaieren licht naar buiten uit zonder elkaar te kruisen, en
onder de balk lekt een smalle gloed met zwakke lamppunten.

De maaibanen reageren op het licht: de sprieten liggen per baan naar
boven of naar onder, en scheerlicht verder van de lampen maakt het
verschil groter.

De aftraptijd (`data-kickoff`) bepaalt het lichtmoment: aftrap om 18:00
of later (Nederlandse tijd) is een avondwedstrijd met stadionlicht.
Eerder is het middag: de tribune boven werpt een vaste schaduw van
14 meter met een zachte, licht golvende rand over het bovenste deel van
het veld. Zonder aftraptijd is het avond. De knop ‘Lichtmoment’ wisselt
tussen automatisch, avond en middag.

Clubnamen hebben een strakke contactschaduw met een brede, zachte
schaduw. De score is een stadionscorebord, geen klapbord: matzwart
paneel met een fijn ledraster, warmwitte cijfers met een lichte gloed
en een glasreflectie. De lichte schaduw valt vooral naar onderen, bij
thuis iets naar links en bij uit iets naar rechts.

De systeempagina geeft `section > * + *` een bovenmarge. In het bord
zet de proef die marge op nul, zodat de streepjes van de gebeurtenissen
tot aan de standkleur lopen, net als op detailpagina’s.

De opkomst houdt het oude tempo: eenmaal per voorbeeld per tabsessie
(sleutel `scc-turf-light-v1:<data-turf>`), 2200ms met dezelfde curve en maximaal
400ms spreiding, nu van het midden naar buiten. Alleen tijdens die
opkomst tekent een eindige renderlus; daarna staat het veld stil. Bij
`prefers-reduced-motion` staat het licht direct aan. ‘Stadionlicht
aan/uit’ en ‘Licht opnieuw’ dienen voor de vergelijking.

De donkere laag ligt vooral achter het tekstblok, zodat de randen hun
licht houden; bij middaglicht is die laag iets lichter. De shader voegt
ruis van een halve kleurstap toe tegen banding. De doelmonden, de
strafschopstippen en het midden zijn iets kaler en geler.


De grastextuur heeft fijne ondergroei en gebogen, over de randen doorlopende
sprieten. Twee textuurschalen verminderen herkenbare herhaling. Het blijft
procedureel gras; er is geen fotografische of gegenereerde beeldasset gebruikt.
De veldlijnen zijn zachter, ook in de SVG-reserve. Scoretegels krijgen een
klein warm bovenlicht en slagschaduw. Het streepje tussen de clubs/score en
de verbindingen naar doelpunten gebruiken gedempt zandkleurig licht. Deze
verfijningen gelden alleen wanneer de grasvariant aanstaat.

De eindtijd onder de score staat in de proef 8px lager. Op home volgt de
middenstip het gemiddelde verticale midden van beide clubnamen; op mobiel
ligt hij tussen de gestapelde namen. WebGL en de SVG-reserve delen deze
uitsnede. De berekening volgt resize en geladen fonts en voorkomt extra
uitloopgras na de verschuiving.
