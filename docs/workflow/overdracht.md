# Overdracht

## Lucht naar de zonnestand, lampen altijd aan (23 oktober 2026)

De masten van de tribune branden nu altijd. De lucht erachter volgt de
zonnestand boven Leeuwarden midden in de wedstrijd (aftrap plus 45
minuten, `sky()` in `js/modules/scc/stand.js`): blauw overdag, een
oranje-paarse horizon in de schemering, donker in de nacht. stand.js zet
`--sky-top` en `--sky-horizon` op `.scc-stand`; de CSS laat de lucht in een
lang verloop (tot 520px) in de pagina opgaan, zonder zichtbare overgang.
Bundels en nevel zijn sterker naarmate het donkerder is; flitsers alleen in
het donker. Het veld (turf.js) is niet aangepast: dat houdt avondlicht of
middagschaduw. Controle: `npm run check:build` geslaagd, bekeken op 1920px
(16:45 eind augustus, 20:00 begin augustus, 20:00 november). Geen commit,
push of deploy.

## Stadion op de wedstrijdpagina's: thuis en uit (23 oktober 2026)

De wedstrijdpagina's hebben nu ook de tribune achter logo en bord en het
publiek in de marges (`src/scc/view/match.njk`, `js/components/scc-match.js`).
Bovenin staat altijd het Kooi, ook bij uitwedstrijden; `data-result` kleurt
de stemming: bij winst vaker flitsers, bij verlies minder en meer lege
plekken. Het verschil tussen thuis en uit zit in de marges (`data-venue`
uit `story.side`): thuis de harde kern, uit hetzelfde geel-blauwe publiek
achter de donkere hekken van het uitvak. Een eerdere uitversie met een
grijs vreemd stadion en ledstrook is op verzoek weggehaald (te grijs en
wit). Het licht volgt het veld: avond of middag op basis van de aftrap. De
CSS-regels voor tribune en kop gelden nu voor `.scc-archive` en
`.scc-match`. Controle: `npm test` en `npm run check:build` geslaagd,
bekeken op 1920px (thuis avond met winst, thuis middag, thuis verlies, uit
avond). Geen commit, push of deploy.

## Harde kern en rook naast de pagina (23 oktober 2026)

Op home staat achter alles een vaste laag (`js/modules/scc/sides.js`,
`.scc-sides` in `css/pages/scc.css`) die alleen in de marges naast de
inhoud zichtbaar is. Twee canvassen: het publiek (stilstaand, een dichte
donkere massa in perspectief met hier en daar geel, sjaals en armen omhoog,
`blur(4px)`) en trage gele en blauwe rook die omhoog drijft (`blur(10px)`),
het enige dat beweegt. Vlaggen en vuurwerk zijn op verzoek weer weggehaald:
te opvallend. Alleen bij een marge van minstens 64px (vooral vanaf ongeveer
1440px); verborgen tabblad pauzeert, prefers-reduced-motion zet de rook
stil. Controle: `npm run check:build` geslaagd, bekeken op 1920px. Geen
commit, push of deploy.

## Kooi Stadion achter de hero (23 oktober 2026)

Op home staat achter de hero de noordtribune van het Kooi Stadion als
sfeerbeeld (`js/modules/scc/stand.js`, `.scc-stand` in `css/pages/scc.css`).
Twee lagen: de tribune op een canvas dat de CSS onscherp zet (`blur`,
`ctx.filter` werkt niet in elke browser), en een scherpe lichtlaag
(`mix-blend-mode: screen`) met de vakwerkmasten, gloed, bundels en nevel.
De tribune is even breed als de hero en sluit direct aan op de
voorspellingsbalk (`--stand-front`, gezet door stand.js). Blauwe stoeltjes,
gele stoelen met boven WIJ ZIJN en onder CAMBUUR; bijna uitverkocht, dus
het publiek bedekt de meeste stoelen en aan de zijkanten zijn er meer leeg.
Het logo ligt over dakrand en bovenring, boven het lege middelste vak. Het
licht volgt `data-light` van het veld: avond met masten aan en af en toe
een flitser (niet bij prefers-reduced-motion), middag met masten uit. In de
hero heeft het blok met datum en ploegen geen bovenpadding meer. Controle:
`npm run check:build` geslaagd, bekeken op 500 en 1440px; de middagstand
is niet bekeken. Geen commit, push of deploy.

## Spelerdetail compact (23 oktober 2026)

De uitklaprij van een speler toont zijn cijfers als compacte lijst (label,
getal, toelichting per regel) in plaats van tegels met meters; op een
brede tabel in twee kolommen. Op een telefoon ongeveer een derde van de
oude hoogte. Controle: `npm test` (41 geslaagd), `npm run check:build`
geslaagd, bekeken als iPhone 13 en op 1280px. Geen commit, push of deploy.

## Seizoenskop uitgelijnd op desktop (23 oktober 2026)

Vanaf 1024px staat de W/G/V-telling boven de cijferkaarten en begint de
vormstrook boven de wedstrijdlijst, gelijk met de linkerrand van het kader. Controle:
`npm run check:build` geslaagd, bekeken op 1024 en 1280px. Geen commit,
push of deploy.

## Cijfertegels gelijkgetrokken (23 oktober 2026)

Topscorer, De nul, balbezit, xG en op doel staan nu als tegel met vlak en
kader, even groot als het rapportcijfer ernaast (44px, op mobiel 36px). De
kaartenblokjes op home volgen die maat. Zie
[wedstrijden.md](../architectuur/wedstrijden.md#mobiele-weergave-23-oktober-2026).
Controle: `npm run check:build` geslaagd, bekeken als iPhone 13 en op
1280px. Geen commit, push of deploy.

## Speeltijd uit de mobiele wedstrijdhero (23 oktober 2026)

Onder 640px staat de speeltijd (bijvoorbeeld 90′+) niet meer onder de
cijfertegels; op het gras was die slecht leesbaar. Vanaf 640px blijft hij
onder de uitslag. Tussen de tegels en het laatste doelpunt staat
16px extra ruimte. Controle: `npm run check:build` geslaagd. Geen commit,
push of deploy.

## Voorspelling verduidelijkt (23 oktober 2026)

De percentages op de homehero staan midden onder hun eigen kleurvlak; vanaf
md staat eronder winst, gelijk of verlies (vanuit Cambuur). `displayPrediction`
in `scc-preview.js` laat de getoonde verdeling vast per wedstrijd een paar
procent afwijken en geeft elk vlak minimaal 5%. Op de wedstrijdpagina staan
formatie en trainer onder lg alleen in een open opstellingskop, onder de
clubnaam. Controle: `npm test` (41 geslaagd, nieuwe test voor de
verdeling), `npm run check:build` geslaagd, bekeken als iPhone 13 en op
1280px. Geen commit, push of deploy.

## Mobiele optimalisaties, ronde 2 (23 oktober 2026)

Kerncijfers op de wedstrijdpagina en de wedstrijdgegevens (ronde, stadion,
scheidsrechter) zijn onder 640px compact, zoals de seizoenscijfers op de
home. De opstellingen klappen via hun eigen kop in en uit; onder lg is één
ploeg tegelijk open (de losse balk is vervangen). De dunne verloopstrook
staat nu ook op desktop direct; hover toont hem voluit. De knipperende
cursor in de homehero is weg. Details: [wedstrijden.md](../architectuur/wedstrijden.md#mobiele-weergave-23-oktober-2026).
Onder 640px heeft de wedstrijdhero dezelfde opzet als de homehero: de
uitslag rechts per ploeg, en daaronder het verloop langs de scorekolom
(alleen CSS, `scc-ui.css`).

Controle: `npm test` (40 geslaagd), `npm run check:build` geslaagd,
bekeken als iPhone 13, op 360, 700 en 1280px. Geen commit, push of deploy.

## Mobiele optimalisaties (23 oktober 2026)

Homehero onder 640px: één regel per ploeg (naam links, vorm rechts, stand
eronder), thuis boven en uit onder; de thuis/uit-labels zijn alleen nog
voor schermlezers. Datum, ploegen en klok delen de linkerrand; binnenmarge
20px en kleinere tussenruimtes. Seizoenen: de vormstrook staat pas vanaf
md, de telling W/G/V blijft. De vier cijferkaarten vormen onder 640px één
paneel met vier regels (getal links, label en naam ernaast, zonder de
toelichting). Op touch (`hover: none`) staat de verloopstrook van elke rij
direct, 2px hoog met 30% gloed, en schuift hij omhoog zodra de rij in beeld
komt (bestaand tempo). Wedstrijdpagina: de opstelling van de tegenstander
staat onder lg ingeklapt (`data-lineup-fold`, `scc-match.js`; in ronde 2
herzien). Zie
[wedstrijden.md](../architectuur/wedstrijden.md#mobiele-weergave-23-oktober-2026).

Controle: `npm test` (40 geslaagd), `npm run check:build` geslaagd,
bekeken als iPhone 13 (390px, touch) en op 1280px. Geen commit, push of
deploy.

## Conceptverslagen bij lokaal starten (23 oktober 2026)

`npm run dev` voert nu via `predev` eenmaal `scc:new-reports` uit vóór
Netlify Dev start. De taak leest de officiële uitslagenpagina, beperkt zich
tot competitie- en bekerduels van het huidige seizoen en maakt alleen
ontbrekende Markdown-verslagen aan. Bestaande teksten blijven staan;
nieuwe paden staan in de terminal. Bij een bron- of netwerkfout verschijnt
een waarschuwing en start de server alsnog. Een losse controle kan met
`npm run scc:new-reports`. De actuele clubpagina gaf op 23 oktober geen
ontbrekende wedstrijden. Controle: `npm test` (40 geslaagd) en
`npm run check:build` geslaagd. Geen dev-server, commit, push of deploy.

## Zoekmachine-indexering uitgeschakeld (22 oktober 2026)

Alle HTML-pagina's krijgen `noindex, nofollow` via de gedeelde layout.
Netlify stuurt dezelfde instructie als `X-Robots-Tag` voor alle statische routes,
ook voor niet-HTML-bestanden. `robots.txt` blijft crawlen toestaan zodat
zoekmachines de instructie kunnen lezen; de sitemap en de verwijzing
ernaar zijn verwijderd. Controle: `npm run check:build`. Geen commit, push
of deploy.

## Wedstrijdbalk herschikt (22 oktober 2026)

De kanten van de balk onderaan zijn gespiegeld rond het logo: pijl aan de
buitenrand, tekst (richting en datum, tegenstander, competitie) en de
uitslagchip aan de binnenkant naast het logo. De gekleurde zijstreep is
weg; de chip draagt de uitslagkleur. Vanaf lg is alles een stap groter
(96px hoog, naam 22px, uitslag 20px, logo 56px). Namen worden niet meer
afgekapt: ze lopen door op twee regels, en onder 640px staat de uitslag
naast de richting (zonder pijl) zodat de naam de volle breedte heeft. De competitieregel staat
nu pas vanaf 1024px, zodat hij niet afgekapt wordt. De regel met competitie,
ronde en thuis/uit staat in de schreefloze letter (13px, 68% tekstkleur)
in plaats van in gedempte mono-kapitalen, zodat hij zich onderscheidt van
de richting en datum erboven.

Controle: `npm run check:build`, bekeken op 360, 414, 560, 700 en
1440px. Geen commit, push of deploy.

## Datum, competitie en ronde in de wedstrijdbalk (22 oktober 2026)

De vaste balk onderaan toont per kant vanaf 640px de datum naast de
richting en vanaf 768px een regel met competitie, ronde en thuis/uit.
`roundLabel` in `scc-match-view.js` is geëxporteerd; `row()` in
`scc-archive.js` levert daarmee `round` (alleen de ronde).

Controle: `npm run check:build`, `npm test` (38 geslaagd), bekeken op
500, 700 en 1440px. Geen commit, push of deploy.

## Dock verwijderd, scrollbalk in huisstijl (22 oktober 2026)

De dock en console zijn helemaal uit de repo: `dock.njk`, `ticker.njk`,
`dock.css`, `ticker.css`, `js/components/ticker.js`,
`js/modules/console/`, `js/modules/effects/ticker.js`,
`js/modules/data/time.js`, de dock-test en `docs/componenten/dock.md`.
Ook weg: `site.dock` en `site.location`, de front matter `console:`, de
dock-tokens in `theme/layout.css`, `#scc-match-data` met
`matchView().summary` en het event `scc:match` in `scc-archive.js`.
`base.njk` houdt een vaste onderruimte van 96px (`h-24`). `font-pixel`
en `--color-warn` blijven: het raster en het design system gebruiken ze.

De scrollbalk (`base/scrollbar.css`, tokens in `theme/colors.css`) is
gedempt grijs met 2px lucht en afgeronde hoeken, Cambuurgeel onder de
muis; Firefox krijgt `scrollbar-width: thin` met dezelfde kleuren.

Controle: `npm run check:build` en `npm test` (38 geslaagd), scrollbalk
bekeken op 1440px. Geen commit, push of deploy.

## Avondveld lichter (22 oktober 2026)

Het avondlicht in `js/modules/scc/turf.js` is opgehoogd: grondlicht van
0,48 naar 0,62 en lampbijdrage van 0,92 naar 1,0. Dat geldt voor de hero,
het wedstrijdbord en (gedeelde shader) de opstellingsvelden. Middaglicht
ongewijzigd.

Controle: developmentbuild geslaagd; detail (20:00) bekeken in headless
Chrome op 1440px. Geen commit, push of deploy.

## Logo in de kop, vaste wedstrijdbalk onderaan (22 oktober 2026)

De kop toont op alle SCC-pagina's alleen het Cambuurlogo, gecentreerd en
linkend naar `/`; tekst „SC Cambuur Wedstrijden" en de knoppen Archief,
Vorige en Volgende zijn weg. Het logo staat lokaal in
`src/assets/scc/cambuur.png` (teamlogo 420 van de API-Football-CDN, eenmalig
gedownload). De wedstrijdpagina heeft een vaste balk onderaan
(`matchPager` in `ui.njk`, `.scc-pager` in `scc-ui.css`) met vorige, het
logo als homeknop en volgende; die vervangt de kaarten `.scc-next`.

Controle: `npm run check:build`, bekeken op 500px en 1440px.
Geen commit, push of deploy.

## Opstellingen thuis links, uit rechts (22 oktober 2026)

Vanaf lg staan de opstellingskaarten (veld en rapportcijfers) in de
volgorde van de hero: thuis links, uit rechts, net als Cijfers al deed.
`.scc-lineup-team` kreeg `data-side`; `scc.css` zet de volgorde met
`order`. Onder lg blijft Cambuur bovenaan.

Controle: `npm run check:build`, bekeken op 1440px bij een uitwedstrijd.
Geen commit, push of deploy.

## GitHub-koppeling (22 oktober 2026)

De bestaande lege Git-initialisatie is gekoppeld aan
`https://github.com/dydric/scc.diederikdijkstra.nl.git`. De werkbranch is
`main`; de bijbehorende werkinstructie en workflowdocumentatie gebruiken
nu dezelfde naam. De repository was bij de controle op GitHub leeg.
`.env`, lokale buildbestanden en afhankelijkheden blijven buiten Git.

## Opstelling in de tabelkaart op het heroveld (22 oktober 2026)

De speelhelften liggen op hetzelfde WebGL-gras als de hero, van bovenaf,
randloos binnen de tabelkaart: onder de kop (ploeg, formatie, trainer,
gemiddelde) en boven Basis. De losse veldkop boven de kaart is vervallen.
Spelers zijn ledtegels met rugnummer, rapportcijfer en statusbadge; de
wisseltijd staat nu wit op zwart in 11px, doelpuntmakers hebben een witte
lichtrand en een fellere lichtvlek. De eerdere 3D-kanteling is op verzoek
teruggedraaid. `turf.js` kreeg een algemene uitsnede (`basis`/`origin`) en
`data-turf-view="half"`; de hero rekent hetzelfde als voorheen. Zie
[wedstrijden.md](../architectuur/wedstrijden.md#opstelling-op-het-heroveld-in-de-tabelkaart-22-oktober-2026).
De opkomst van de tegels (620ms, overshoot) is nieuw; graag beoordelen.

Controle: `npm test` 41/41, development- en productiebuild geslaagd;
opstellingen op 1440 en 390px en de hero bekeken in headless Chrome. Let
op: een PNG-screenshot met de hero in beeld blijft in headless Chrome
hangen; JPEG met `optimizeForSpeed` werkt. Geen commit, push of deploy.

## Eigen doelpunt kleurt wedstrijdverloop correct (22 oktober 2026)

De opgeslagen API-respons koppelt eigen doelpunten aan de profiterende
ploeg. `scc-match-story.js`, de doelpuntweergave in `ui.njk` en de
archiefstatistieken draaiden die ploeg nogmaals om. Daardoor was de
timeline na Jong AZ – SC Cambuur 0–1 rood. De tussenstand en
archieftelling volgen nu rechtstreeks `event.team`. Op verzoek staan de
doelpuntenmaker en zijn markering aan de kant van zijn eigen club; de
standkleur volgt de profiterende ploeg. Ook de andere twee opgeslagen
wedstrijden met een eigen doelpunt zijn gecontroleerd.

Controle: tests en `npm run check:build`. Geen commit, push of deploy.

## Achtergrondverlichting bij wedstrijdhover (22 oktober 2026)

De seizoensrijen op de homepage lichten bij hover en toetsenbordfocus
op met 7% wit. De achtergrond vloeit in 480ms in en uit, samen met de
bestaande timelinegloed, zonder het tempo van gloed of strook te wijzigen.
Toetsenbordfocus krijgt een binnenrand; verminderde beweging schakelt de
achtergrondovergang uit. Alleen `src/css/pages/scc.css` aangepast.

Controle: `npm run check:build` geslaagd (84 bestanden). Niet visueel
in een browser gecontroleerd. Geen commit, push of deploy.

## Voetbalveld op home en wedstrijdpagina's (22 oktober 2026)

Het grasveld uit de proef staat nu op de homehero en het wedstrijdbord:
module `js/modules/scc/turf.js`, opmaak `css/components/scc-turf.css`
(asset `scc-turf`). `board()` kreeg een vijfde parameter (`turf`), home
geeft `data-kickoff` mee en werkt die bij na het verversen. De naam is
`turf` omdat `.scc-pitch` al het opstellingsveld is; die botsing maakte
de hero's eerst te hoog. De hero-hoogtes zijn nu gelijk aan het origineel
(home 483/500px, detail 682/618px op 1440/390). De SVG-reserve verschijnt
alleen zonder JS of WebGL, dus geen storing meer bij het laden. Nieuw: het
veld komt in 300ms op na de eerste render. `pitch.svg` staat nu in
`assets/scc/`. `/system/grass/` gebruikt dezelfde module.

Controle: development- en productiebuild geslaagd; home, detail (avond en
middag) en proef bekeken in headless Chrome op 1440 en 390px, zonder
horizontale overflow. Geen commit, push of deploy.

## Scorecijfers verticaal gecentreerd (22 oktober 2026)

In `.scc-flap` stonden de cijfers 0,03em te laag: bij regelhoogte 1em ligt
de basislijn van Space Mono Bold op 0,88em. De padding is nu 0,11em boven en
0,17em onder (was 0,14em rondom); de tegelhoogte blijft 1,28em. Controle:
`npm run check:build` geslaagd.

## Lichtmoment op aftraptijd, scorebord en timeline (22 oktober 2026)

Lokale grasproef: het lichtmoment volgt alleen de aftraptijd (vanaf
18:00 avond met stadionlicht, anders middag met een vaste tribuneschaduw);
de zonnestandberekening is vervallen. De waaierschaduwen zijn vervangen
door een strakke naamschaduw. De score is een stadionscorebord met een
lichte schaduw die vooral naar onderen valt, bij thuis iets naar links en
bij uit iets naar rechts. De streepjes van de gebeurtenissen lopen weer
tot aan de standkleur: de sectiemarge van de systeempagina is in het
bord op nul gezet. Openbare pagina’s ongewijzigd.

Controle: developmentbuild geslaagd; bekeken in headless Chrome op 1440
en 390px. Geen commit, push of deploy.

## Stadionlicht vanachter de timeline (22 oktober 2026)

Lokale grasproef: de vier hoekbundels (CSS) zijn vervangen door licht in
de shader, met negen lampen achter de timeline. Daardoor geen kruispatroon
meer op kleine schermen. Maaibanen reageren op het licht, schaduwen onder
namen en scoretegels, slijtage in doelmonden en midden, ruis tegen banding
en een donkere laag die vooral achter de tekst ligt. De aftraptijd kiest
avond (stadionlicht) of middag (tribuneschaduw volgens de zonnestand);
de knop ‘Lichtmoment’ forceert er één. Het opkomsttempo is ongewijzigd
(2200ms, maximaal 400ms spreiding). Openbare pagina’s ongewijzigd.

Controle: developmentbuild geslaagd; avond, middag en automatisch bekeken
in headless Chrome op 1440 en 390px, zonder horizontale overflow.
Opkomst en ‘Stadionlicht uit’ gecontroleerd. Let op: een screenshot met
`captureBeyondViewport` toont de WebGL-canvas zwart; dat is een artefact
van de opname, niet van de pagina. Geen commit, push of deploy.

## Tijd en middenstip uitgelijnd (22 oktober 2026)

In de lokale grasproef staat de eindtijd 8px lager onder het scorestreepje.
De middenstip op home volgt het midden van de clubnamen, op mobiel tussen
de gestapelde namen. WebGL en SVG gebruiken dezelfde begrensde uitsnede,
ook na resize/fontladen. Openbare pagina’s ongewijzigd.

Controle: developmentbuild geslaagd; geen nieuwe visuele browsercontrole.
Geen commit, push of deploy.

## Gras, scoretegels en verbindingskleur verfijnd (22 oktober 2026)

Lokale grasproef: textuur op 2048px met fijne ondergroei, gebogen sprieten
en twee sampleschalen tegen herhaling. Geen beeldgeneratie of extra
bibliotheek. Zachtere veldlijnen (ook SVG), meer diepte in de scoretegels
en een gedempte zandkleur voor het club-/scorestreepje en doelpuntverbindingen.
Alleen de grasvariant; openbare pagina’s en animatietempo ongewijzigd.

Controle: één developmentbuild geslaagd; geen nieuwe visuele browsercontrole.
Geen commit, push of deploy.

## Zachter en warmer stadionlicht (22 oktober 2026)

De vier lichtbronnen op de lokale grasproef zijn warmwit gemaakt, met
lagere intensiteit, zachtere kernen en diffuser aflopende bundels. Een
masker dempt het licht in het midden om de tekst voldoende contrast te
geven. Opkomsttempo ongewijzigd. Geen wijziging aan openbare hero’s.

Controle: developmentbuild geslaagd. Deze kleurverfijning niet opnieuw
visueel gecontroleerd. Geen commit, push of deploy.

## Meer stadionsfeer vanuit vier hoeken (22 oktober 2026)

De lokale grasproef heeft nu vier heldere lichtkernen met koele halo’s,
diagonale bundels en zachte nevel. De bundels blijven achter de tekst en
maximaal 560px hoog. De eenmalige opkomst en het tempo zijn ongewijzigd.
Geen aanpassing aan de openbare hero’s.

Controle: developmentbuild geslaagd; sfeerlicht in Chrome bekeken,
herhalen/uitschakelen en verminderde beweging gecontroleerd. Hoge hero op
390px zonder overflow. Lichtlaag daarna boven de verduistering geplaatst,
onder de tekst. Geen commit, push of deploy.

## Hoekverlichting in de grasproef (22 oktober 2026)

Vier zachte lichtbundels achter de inhoud op `/system/grass/`. Eenmalige
opkomst per voorbeeld per tabsessie bij binnenkomst in beeld; daarna
statisch. Bij verminderde beweging direct aan. Vergelijkknop en ‘Licht
opnieuw’ toegevoegd. Bundels groeien niet onbeperkt met de hero mee
(maximaal 560px). Op verzoek geen Feyenoordvoorbeeld toegevoegd; de
bestaande hoogtetest blijft behouden. Alleen lokale proefassets gewijzigd.

Controle: developmentbuild geslaagd; hoeklicht, uitschakelen, opnieuw
afspelen en verminderde beweging gecontroleerd in geïsoleerde Chrome.
Hoge hero op 390px: geen horizontale overflow, bundelhoogte 560px.
Geen commit, push of deploy.

## Lokale grasproef voor beide hero’s (22 oktober 2026)

Nieuwe `/system/grass/` met home- en detailvoorbeeld, procedureel WebGL-gras,
maaibanen, veldlijnen en vast licht. Op vervolgverzoek is muisbeweging
verwijderd. Het veld wordt proportioneel bijgesneden bij hoge hero’s; de
hoogtetest herhaalt doelpunten met een zichtbare testmelding. Vergelijking
met bestaande achtergrond en lichtregelaar toegevoegd. Statisch SVG-reserveveld
bij ontbrekend JS/WebGL/contextverlies; maximaal 2× renderresolutie,
begrensd op 2560 × 4096. Zie `paginas/system.md` voor bestanden en grenzen.

Alleen het lokale system is uitgebreid; home/detail zijn niet aangepast.
Geen dev-server, commit, push of deploy. Controle: developmentbuild geslaagd;
WebGL, vergelijking, reserveveld en responsive layout in geïsoleerde Chrome
gecontroleerd. Hoogtetest met 16 regels op 390px: geen horizontale overflow.
Productiebuild geslaagd; geen system-routes of verwijzingen naar de
grasproefassets in productie-HTML.

## Rustgloed en soepelere hover (22 oktober 2026)

De tijdlijn heeft nu afzonderlijke lagen voor gloed en kleurstrook.
In rust blijft alleen 16% van de gloed zichtbaar. Hover of toetsenbordfocus
laat de 4px strook in 400ms omhoogkomen met een zachte uitloop; de gloed
neemt in 480ms toe en keert bij verlaten rustig terug. Het tempo is op
verzoek verfijnd. Bij verminderde beweging zijn de overgangen direct.

Controle: `npm run check:build` geslaagd. Niet visueel in de browser
gecontroleerd. Geen commit, push of deploy.

## Dunnere hoverstrook en meer gloed (22 oktober 2026)

De hoverstrook is gehalveerd van 8 naar 4px. Twee schaduwlagen geven
meer gloed naar boven, met behoud van de bestaande overgang van 240ms.
Controle: `npm run check:build` geslaagd; niet visueel in de browser bekeken.

## Resultaatblokjes en hoververloop op de home (22 oktober 2026)

De seizoensrijen tonen achter de uitslag een blokje van 32px met W, G of V,
in plaats van de punten (+3/+1/+0). De gekleurde linkerstrip is verwijderd.
Hover en toetsenbordfocus schuiven onderaan een 4px hoge kleurstrook omhoog,
met een sterkere, omhoog uitwaaierende gloed per segment. De segmenten komen uit dezelfde
`matchStory(...).states` als het detailbord, inclusief de tijdsverhouding;
zonder wedstrijddata ontbreekt de strook. Er staan geen symbolen of labels in.
De nieuwe overgang duurt 240ms en vervalt bij verminderde beweging.
Bestaande animatietempo's blijven gelijk.

Seizoenen en Programma delen `.scc-list-date`: 14px Space Mono en 55% wit.
De notatie is `za 24 okt`, zonder afkortingspunten; het programma houdt
de aftraptijd erachter. De browserverversing gebruikt dezelfde klasse.

Controle: `npm run check:build` en alle 39 tests geslaagd. De gebouwde
HTML gecontroleerd op resultaatblokjes en tijdlijnsegmenten. Nog niet
visueel in een browser gecontroleerd. Geen commit, push of deploy.

## Lange clubnamen kleiner en gelijk uitgelijnd (22 oktober 2026)

Bij meer dan elf tekens in een clubnaam krijgen beide titels dezelfde
kleinere maat: 24/32/40/56px op mobiel/md/lg/xl. Dit werkt bij de build
en na programmaverversing. Vanaf 640px delen de ploegen drie subgridrijen
voor label, naam en context. Het middenstreepje centreert in de naamrij.

Controle: `npm run check:build` geslaagd. Fortuna Sittard en Go Ahead
Eagles in tijdelijke layoutproeven bekeken en gemeten op 320, 390, 768,
1024 en 1440px: beide namen telkens op één regel, zonder overflow;
vanaf 768px vormreeksen exact op gelijke hoogte. Proefbestanden verwijderd,
echte wedstrijddata ongewijzigd.

## Layoutcontrole Go Ahead Eagles (22 oktober 2026)

Dezelfde tijdelijke layoutproef als bij Fortuna, op 320, 390, 768, 1024
en 1440px. Op 390px past Go Ahead Eagles op één regel; op de overige
geteste breedtes breekt de naam netjes als `Go Ahead` / `Eagles`. Geen
afkapping of overlap. Naast Cambuur op tablet/desktop staan de vormreeksen
wel ongelijk, zoals bij Fortuna. Alleen gecontroleerd; opmaak en echte
wedstrijddata ongewijzigd. Tijdelijke proefbestanden verwijderd.

## Layoutcontrole Fortuna Sittard (22 oktober 2026)

Met een tijdelijke statische kopie van de controlebuild is Fortuna Sittard
als thuisploeg tegenover SC Cambuur bekeken op 320, 390, 768, 1024 en
1440px. Geen afkapping of overlap in de hero. Op 320/390px past de naam
op één regel. Op 768/1024/1440px gebruikt Fortuna twee regels en Cambuur
één; daardoor staan de vormreeksen ongelijk. Mogelijke vervolgstap:
naamvlakken even hoog maken en vormreeksen op dezelfde rij uitlijnen.
Dit was alleen een controle; productieopmaak en echte wedstrijddata zijn
ongewijzigd. Tijdelijke proefbestanden verwijderd. Controlebuild geslaagd.

## Programmakop (22 oktober 2026)

De kop boven de komende wedstrijden onder de homehero heet nu `Programma`
in plaats van `Daarna`. Alleen het label is aangepast; template gecontroleerd.

## Grotere clubnamen op brede schermen (22 oktober 2026)

De homehero gebruikt vanaf lg 64px en vanaf xl 80px voor de clubnamen
(voorheen maximaal 56px). Regelhoogte en middenstreepje schalen mee.
Mobiel en tablet behouden hun bestaande naamgrootte; lange namen mogen
binnen hun kolom afbreken. Controle: `npm run check:build` geslaagd.

## Homehero: eerstvolgende wedstrijd leidend (22 oktober 2026)

Datum en aftrap staan centraal boven de ploegen. Thuis/uit-labels maken
de volgorde expliciet; onder 640px staan beide ploegen onder elkaar met
de eigen vorm onder de naam. De klok is een kleine tekstregel zonder
tegelachtergronden, met hetzelfde tempo en aftrapgedrag. `Daarna` is een
compacte gedempte lijst zonder gekleurde clubnamen, vorm of stand.
Nunjucks en de browserverversing zijn gelijkgetrokken. De visuele
aansluiting op het detailbord blijft behouden.

Controle: tijdelijke productiebuild geslaagd, 39/39 tests geslaagd,
visueel bekeken op desktop en 390px in de bestaande lokale browser.
De aanvullende tabletcontrole en het terugzetten van de viewport liepen
vast door een time-out in de browserbediening. Geen dev-server gestart,
geen commit, push of deploy uitgevoerd.

## Aftelklok onder de ploegen (21 oktober 2026)

De klok staat nu onder de ploegen. De verticale as tussen de ploegen is
vervallen; alleen het scorestreepje op naamhoogte blijft.
Klokgedrag en tempo ongewijzigd. Controle: `npm run check:build` en
browser op 1440 en 390px.

## Thuisvorm boven de naam op smalle schermen (21 oktober 2026)

Onder 400px, waar de ploegen onder elkaar staan, staan de vormblokjes van
de thuisploeg boven de naam en die van de uitploeg eronder. De ruimte
tussen de ploegen is daar 8px, zoals op de detailpagina. Controle:
`npm run check:build` en browser op 390px.

## Vormblokjes dichter op de club (21 oktober 2026)

De ruimte tussen clubnaam en vormblokjes is 6px (vanaf md 8px); onder
400px heeft de gestapelde naam een regelhoogte van 28px. Onder 640px zijn
de blokjes 16px met 2px tussenruimte, daarboven 22px zoals de
seizoensvorm. Controle: `npm run check:build` en browser op 1440 en 390px.

## Daarna zonder kop, rijen tot de rand (21 oktober 2026)

De kop "Daarna" is weg. De rijen lopen door tot de zijkanten van het
paneel, met de paneelpadding binnen elke rij; de eerste rij heeft geen
extra lijn boven de bestaande paneelscheiding. Vanaf lg alleen een
vormkolom als er vorm is, zodat de competitie rechts tegen de rand staat.
Controle: `npm run check:build` en browser op 1440 en 390px.

## Archiefdatum boven de tegenstander (21 oktober 2026)

Onder 640px staat de datum in de seizoensrijen boven de tegenstander, met
de uitslag rechts over beide regels. De datum heeft overal de grootte van
`Daarna` (16px, vanaf sm 18px); de datumkolom is vanaf sm 128px, vanaf md
136px. De 19px-uitzondering voor smalle telefoons is vervallen. Controle:
`npm run check:build` en browser op 768, 390 en 320px.

## Vormblokjes en datumnotatie gelijkgetrokken (21 oktober 2026)

De W/G/V-blokjes in de hero en bij `Daarna` gebruiken nu de stijl van de
seizoensvorm (`.scc-form-cell`): 22px, volle uitslagkleur, mono 10px vet.
Datum en aftrap bij `Daarna` zijn groter (16px, vanaf sm 18px). Alle
wedstrijddatums gebruiken dezelfde notatie en kleur ("za 18 okt",
font-data, vet, wit): `scc-archive.js` formatteert `day` nu met weekdag
en zonder hoofdletters, dus ook in de vormtooltip en de vorige/volgende-
links op detailpagina's. Archiefdatumkolom verbreed; onder 400px is de
tegenstander 19px. Controle: tests, `npm run check:build` en browser op
1440, 390 en 320px.

## Homehero als detailbord, Daarna als rijen (21 oktober 2026)

Tussen de ploegen loopt een as vanaf de klok naar beneden, met het
scorestreepje van het detailbord op naamhoogte. Op mobiel staan datum en
aftrap gecentreerd onder de kopregel; vanaf md in de kopregel. De
voorspellingsbalk is ongewijzigd. `Daarna` is een lijst met rijen: datum en
aftrap, ploegen (Cambuur geel), competitie/ronde en eventueel stand en vorm
van de tegenstander. Vanaf lg één regel; daaronder datum en competitie
boven de ploegen. Controle: tijdelijke productiebuild en browsercontrole
(Playwright met Chrome, tijdelijke statische server) op 1440, 1024, 640,
390 en 320px; geen horizontale overflow.

## Datum en aftrap in de kopregel (21 oktober 2026)

In de kopregel staat in plaats van "Aftrap over" nu de datum en aftrap in
de opmaak van het detailbord (16/18px, vet, gedempte punt), tussen
"Volgende wedstrijd" en de ronde. Het label is vervallen; de klok toont
zelf BEZIG. Tussen de ploegen staat niets meer. Controle:
`npm run check:build`.

## Aftrapgegevens in de kopregel (21 oktober 2026)

"Aftrap over" (of "Wedstrijd" na de aftrap) staat nu in de kopregel
tussen "Volgende wedstrijd" en de ronde; de klok zelf staat direct
eronder, met minder tussenruimte. Het label verdwijnt samen met de klok.
Controle: `npm run check:build`.

## Homehero: klok bovenaan, datum tussen de clubs (21 oktober 2026)

De aftelklok staat gecentreerd bovenaan het paneel (32px op mobiel, 44px vanaf
md, 56px vanaf xl). Datum en aftrap staan tussen de ploegen, gestapeld
vanaf md en op één regel onder de ploegen op mobiel. De ploegen volgen de
responsive opzet van het detailbord: thuis rechts, uit links, onder 400px
gecentreerd onder elkaar. Het label "Laatste 5 · oud → nieuw" en de
Thuis/Uit-labels zijn vervallen. De W/G/V-blokjes in de hero en bij
`Daarna` delen nu dezelfde maat (24px, vanaf sm 32px). Tempo en
klokgedrag ongewijzigd. Controle: `npm run check:build`; nog niet visueel
in de browser bekeken. Open: `Daarna` als rijen in plaats van kaarten.

## Homeopstelling zoals detailbord (21 oktober 2026)

Thuis rechts uitgelijnd, uit links; datum en aftrap gecentreerd erboven
zonder labels, met een punt ertussen. De kleinere aftelklok staat vanaf md
tussen de ploegen op de scoreplek, mobiel eronder. Tempo en klokgedrag
ongewijzigd. Controle: tijdelijke productiebuild en browsercontrole op
1440, 390 en 320px; klokovergangen en weergave zonder JS gecontroleerd.

## Ontbrekende positie verborgen (21 oktober 2026)

Zonder ranglijstgegevens wordt de positieregel volledig weggelaten, zowel
in de statische hero als na de clientverversing. Geen melding of lege
ruimte. Controle: `npm run check:build`.

## Voorspellingsbalk versoberd (21 oktober 2026)

De gekleurde balk sluit aan op de bovenrand. Direct eronder staan alleen
de percentages; ploeglabels blijven beschikbaar voor schermlezers.
De zichtbare API-bron en bijwerktijd zijn verwijderd, ook uit de
clientverversing. Controle: `npm run check:build`.

## Voorspelling als bovenrand (21 oktober 2026)

De voorspelling staat bovenaan de homehero, als 16px-balk over de volle
breedte met dezelfde gloed als de horizontale detailtijdlijn. Groen voor
Cambuurwinst, paars voor gelijk en rood voor tegenstanderwinst; compacte
labels, percentages en broninformatie eronder. De aftelklok en API-opslag
zijn ongewijzigd. Ook bij een verlopen statische beginstand verdwijnt de
voorspelling. Controle: tijdelijke productiebuild en browsercontrole op
1440, 390 en 320px; klokovergangen en verbergen van de voorspelling werken.

## Homehero en API-voorbeschouwing (21 oktober 2026)

De home heeft een breed donker paneel met ploegvorm, bestaande aftelklok
en API-voorspelling; `Daarna` staat eronder. De werkende Free-respons voor
Willem II–Cambuur is lokaal opgeslagen. Standen voor seizoen 2026 worden
door Free geweigerd: de koppeling is gereed, maar positie en punten zijn
nog niet beschikbaar. Geen vervangende bron of fictieve waarden gebruikt.

Nieuwe serverclient en leeslaag: `scc-football-api.js`, `scc-preview.js`.
Lokaal ophalen via `npm run scc:matchdata -- preview`; Netlify via
`scc-preview-refresh` om 03:15 UTC, maximaal drie requests per dagrun,
met conditionele Blob-dagclaim en zeven dagen rust na abonnementsweigering.
De publieke programmafunctie serveert uitsluitend opgeslagen data. Goede
data blijft bij fouten behouden; het oorspronkelijke ophaalmoment blijft
zichtbaar. De klok heeft geen API-verbruik en zijn tempo is behouden.

Voor activering na eigen deploy: `API_FOOTBALL_KEY` als geheim in de
productieomgeving, scope Functions, en het Scheduled-label/log van de
nieuwe functie controleren. Er is geen Netlify-secret ingesteld en geen
deploy uitgevoerd. Zie [API-Football](../integraties/api-football.md).

Controle: 39 tests geslaagd, tijdelijke productiebuild geslaagd en drie
Netlify-functies gebundeld. Visueel gecontroleerd op 1440, 390 en 320px
zonder dev-server; geen horizontale overflow. Klokseconden, BEZIG na aftrap,
verbergen na twee uur, voorspelling verbergen vanaf aftrap, ingelezen
ranglijstgegevens en weergave zonder JS zijn in de browser gecontroleerd.
De Netlify-state bevat geen site-ID; externe configuratie is nog nodig.
De daadwerkelijke API
meldde na onderzoek/import 97 resterende verzoeken. Geen commit of push.

## Uitgoals rechts op mobiel (21 oktober 2026)

Onder 640px spiegelen uitgoals de thuisrij: score rechts, minuut en maker
links daarvan, met rechts uitgelijnde tekst. `data-side` op de doelpuntrij
volgt de profiterende ploeg, ook bij eigen goals.
Controle: `npm run check:build`.

## Compacte mobiele doelpuntenrijen (21 oktober 2026)

Onder 640px staan score, minuut en maker weer op één rij. Een vaste
scorekolom van 56px laat de rest van de breedte vrij voor minuut en naam;
de toelichting staat onder de naam. Verticale padding is 8px per kant,
de verbinding tussen momenten 8px en de rustmarkering 32px hoog.
Controle: `npm run check:build`.

## Kleine schermen: namen en doelpuntmakers (21 oktober 2026)

Tot en met 400px staan beide clubnamen op 24px gecentreerd onder elkaar,
boven de uitslag. Onder 640px staan de doelpuntmakers onder hun tussenstand
op de volle beschikbare breedte, met compacte regelafstand. De minuut en
toelichting blijven zichtbaar; lege ploegkolommen en zijlijntjes verdwijnen.
Controle: `npm run check:build`.

## Mobiele clubnamen uitgelijnd (21 oktober 2026)

De tussenruimte tussen de clubnamen is 48px, gelijk aan het scorestreepje
plus de twee tegelafstanden. De thuisnaam eindigt daardoor boven de
rechterrand van het thuiscijfer; de uitnaam begint boven de linkerrand
van het uitcijfer. Controle: `npm run check:build`.

## Clubnamen boven de mobiele uitslag (21 oktober 2026)

Onder `md` staan de clubnamen naast elkaar boven de gecentreerde uitslag.
Meerregelige namen hebben een compacte regelafstand (`leading-none`). Vanaf
`md` blijft de uitslag tussen de ploegen staan. De tijdas blijft op het
scorestreepje aansluiten. Controle: `npm run check:build`.

## Rijblokjes verwijderd (21 oktober 2026)

De twee kleine blokjes aan het begin van de thuis- en uitrij zijn
verwijderd. De gebeurtenissen en ploegkoppeling blijven gelijk.
Controle: `npm run check:build`. Geen dev-server, commit, push of deploy.

## Tijdrij verwijderd (21 oktober 2026)

De rij met `0′`, `Rust · 45′` en `90′` is uit de bovenste tijdlijn
verwijderd. VAR staat nu in de rij van de betrokken ploeg. Alleen thuis en
uit blijven over; de markeringen beginnen direct onder de gekleurde balk
en de strook is 52px hoog. De grote score, doellijn eronder, datum en
aftraptijd blijven staan. Controle: `npm run check:build` en `npm test`.
Geen dev-server, commit, push of deploy.

## Bal zonder score op mobiel (21 oktober 2026)

Onder `md` toont een doelpunt in de bovenste tijdlijn alleen de bal. De
tussenstand blijft in de toelichting en de toegankelijke knopnaam; vanaf
`md` staat hij ook naast de bal. De doellijn onder de grote uitslag blijft
ongewijzigd. Controle: `npm run check:build`. Geen commit, push of deploy.

## Rustlijn ingekort (21 oktober 2026)

De lange verticale lijn onder `Rust · 45′` is verwijderd. Alleen de
streepjes naast het label en een kort aanzetstreepje bij de balk blijven.
Controle: `npm run check:build`. Geen dev-server, commit, push of deploy.

## Smallere tijdlijn en rust zonder vlak (21 oktober 2026)

De drie rijen zijn samen 72px hoog. De gebeurtenissen staan dichter op
elkaar en hebben geen permanent kader meer; bij hover of focus verschijnt
de klikmarkering. Rust heeft twee korte streepjes naast de tekst en een
verticale lijn die boven en onder het label doorloopt, zonder achtergrond.
De doelpuntenlijn onder de score blijft staan. Controle: `npm run
check:build` geslaagd; de tijdlijn visueel bekeken op 390px voor
Cambuur–AZ en de drukke wedstrijd tegen Jong AZ. Geen dev-server, commit,
push of deploy.

## Tijdlijn in drie vaste rijen (21 oktober 2026)

Het compacte verloop boven de uitslag heeft nu altijd drie rijen: tijd
(met VAR), thuisclub en uitclub. Een verticale lijn markeert de rust.
Doelpunten, kaarten en VAR staan in hun eigen rij; botsende symbolen
schuiven opzij. Een rechte of schuine lijn verbindt elk symbool met de
werkelijke minuut op de gekleurde balk. De ploegblokjes blijven klein en
de doelpuntenlijn onder de score blijft staan. Op mobiel neemt het verloop
geen extra hoogte in bij drukke wedstrijden.

Controle: `npm test` (32/32), `npm run check:build`, screenshots op 390px
en 1440px voor Cambuur–AZ, op 390px voor Jong AZ–Cambuur (zeven
gebeurtenissen per ploeg) en op 390px voor Fortuna–Cambuur. Bij de
uitwedstrijd is thuis expliciet de bovenste rij en Cambuur de onderste. Geen dev-server, commit, push of deploy.

## Doelpuntenlijn onder de score terug (21 oktober 2026)

De verticale doelpuntenlijn onder de eindstand is op verzoek hersteld, met
makers, minuten, tussenstanden en `Rust 45′` wanneer in beide helften is
gescoord. Het compacte verloop bovenaan blijft zichtbaar voor goals,
kaarten en VAR. Beide weergaven hebben zo een eigen functie: boven de
tijdpositie, onder de score het doelpuntverhaal. De lijn en het bord tonen
geen extra as bij 0–0. Controle: `npm run check:build` en `npm test`.
Geen dev-server, commit, push of deploy.

## Tijdlijn uitgelijnd en versoberd (21 oktober 2026)

Balk, minuten en markeringen gebruiken nu dezelfde volle breedte; de
zijmarge onder de balk is verwijderd. Doelpunten sluiten daardoor exact
aan op de kleurwissel. Ploegnamen, horizontale sporen en rasterstreepjes
zijn uit het verloop gehaald. Twee kleine blokjes aan de linkerkant
duiden Cambuur (geel) en de tegenstander (gedempt wit) aan; verder zijn
alleen de verticale lijnen en gebeurtenissymbolen zichtbaar. De banen
liggen dichter bij de balk en bij elkaar. De toelichting noemt de ploeg
bij hover, focus of klik.

Controle: `npm run check:build`, `npm test` en visuele controle op
390px en 1440px. Geen dev-server, commit, push of deploy.

## Gebeurtenissen direct aan de tijdas (21 oktober 2026)

De markeringen staan dichter onder de minuten van de gekleurde balk.
Verticale lijnen wijzen op de exacte minuut; de twee ploegbanen blijven
zichtbaar. De weergave is na visuele controle gecorrigeerd: de template
toonde eerst alle momenten in beide banen en gebruikt nu `stripTeams`
uit het leesmodel om ze per ploeg precies één keer te plaatsen. De tweede, verticale doelpuntenlijst onder het scorebord is
verwijderd. Doelpunten staan nu eenmaal in de tijdlijn, met score en
aanvullende informatie bij hover, focus of klik. `data-timeline` en de
CSS voor de vervallen doelpuntenlijst zijn opgeruimd.

Controle: `npm run check:build` geslaagd. Geen dev-server, commit, push
of deploy.

## Compacte markeringen per ploeg (21 oktober 2026)

Na bijsturing zijn de grote rastervlakken, tekstblokken en uitklaplijst
vervangen door twee compacte banen: Cambuur met geel ploeglabel en de
tegenstander met wit. Korte steeltjes en rasterstreepjes plaatsen balletjes
met score, gele/rode kaarten en VAR op de tijdas. Hover, focus en klik tonen
de details; buiten klikken en Escape sluiten de vastgezette toelichting.
Eigen goals staan bij de profiterende ploeg. De balk en gloed blijven;
er is geen playfunctie. Documentatie en componentproef zijn bijgewerkt.

Controle: `npm run check:build` en `npm test` (32/32). Geen dev-server,
commit, push of deploy. De eerdere screenshots van het grote raster horen
bij de vervallen tussenversie.

## Statisch verloop als bovenrand (21 oktober 2026)

De tijdlijn staat nu bovenaan het scorebord en vervangt de effen gekleurde
lijn. De 16px-balk toont standkleuren met een schaduw per segment; de
bestaande bordgloed blijft behouden. Alle informatie staat eronder: tijden
en een standaard gesloten native uitklaplijst met goals, kaarten en VAR.
De momenten staan chronologisch in één, twee of drie kolommen, afhankelijk
van de schermbreedte. De eindstand blijft vast; play, scrubben en de
bijbehorende JavaScript zijn verwijderd. De dock is niet gewijzigd; de
samenvatting blijft beschikbaar, `scc:moment` wordt niet meer uitgezonden.
Ook de componentproef en het onderwerpdocument zijn bijgewerkt.

Controle: `npm run check:build` geslaagd, `npm test` 32/32. De geopende
momentenlijst visueel gecontroleerd op 390px en 1440px via lokale screenshots
van de tijdelijke build, zonder dev-server. Geen commit, push of deploy.

## Punten uit de gegevens onder het verslag

De kleine gegevens onder het verslag tonen geen punten meer; alleen de
speelronde, het stadion en de scheidsrechter blijven daar staan. Controle:
`npm run check:build` geslaagd.

## Wedstrijdgegevens onder het verslag uitgelijnd

De kleine gegevens onder het verslag beginnen vanaf desktop op dezelfde
linkerlijn als de verslagtekst. Ze verdelen zich in even brede blokken over
de beschikbare tekstkolom; op kleinere schermen passen er minder naast
elkaar. Controle: `npm run check:build` geslaagd.

## Datum en aftrap boven de uitslag

Op de wedstrijddetailpagina staan boven de uitslag alleen datum en aftraptijd,
zonder labels en als één compacte regel met een punt ertussen gecentreerd. Boven die regel blijft ruimte voor een later
compact verloop. Speelronde, punten, stadion en scheidsrechter staan nu klein
onder het verslag, direct boven de scheidingslijn naar de bestaande
scoretijdslijn. De tijdslijn zelf is niet verplaatst. De gespeelde tijd onder
het scorestreepje loopt nu mee bij afspelen en scrubben. Controle:
`npm run check:build` geslaagd.

## Rust alleen tussen doelpunten uit beide helften

De rustmarkering toont alleen `Rust 45′`, zonder ruststand, en verschijnt
alleen als vóór én na rust is gescoord. Bij doelpunten in één helft ontbreekt
de markering. Een 0–0 heeft geen goaltijdlijn of doorlopende as onder de
eindstand. Controle: `npm run check:build`; de gebouwde pagina's bevatten
24 rustmarkeringen tussen goals uit beide helften, 15 tijdlijnen zonder
rustmarkering en één 0–0 zonder tijdlijn.

## Eindtijd leesbaar tussen de scoretegels

De eindtijd is van 9px naar 12px gebracht. Het scorestreepje en de ruimte
tussen de twee tegels zijn verbreed, zodat ook blessuretijd tussen de cijfers
past. De tijd blijft vlak onder het streepje. Tot 360px schalen ploegnamen
en scorecijfers één stap terug om die ruimte vrij te houden; de eindtijd
blijft 12px. Controle: `npm run check:build`; PEC Zwolle–Cambuur visueel op
desktop bekeken. Mobiele weergave na deze maatwijziging niet visueel
gecontroleerd.

## Compacte doellijn en tijd tussen de scorecijfers

De horizontale scheidslijn onder de ploegnamen is verwijderd. Het streepje
tussen de scorecijfers is nu ondoorzichtig; de eindtijd staat klein in die
ruimte, onder het streepje. Doelpunten en rust staan dichter op elkaar, en de
goalminuten staan weer naast de makers. Op de centrale as staan de
tussenstanden en ruststand; de aftrapmarkering is vervallen. Controle:
`npm run check:build`; de gebouwde pagina toont de minuten naast de makers.
Op 390px zijn de posities en horizontale overflow in de browser gecontroleerd.

## Uitslag tussen de ploegen

De scoretegels staan nu op dezelfde rij tussen de ploegnamen. De lijn begint
bij het streepje tussen de cijfers, kruist de rand onder de ploegen en loopt
door via de gespeelde tijd naar de doelpunten. Op smalle schermen schalen de
ploegnamen en scoretegels mee; de bestaande afspeelbare cijfers blijven
gekoppeld. Controle: `npm run check:build`, visueel op desktop, 390px en
320px; geen horizontale overflow op de twee telefoonbreedtes.

## Middenas sluit aan op de uitslag

De lijn onder de grote uitslag loopt nu door tot het streepje tussen de
scoretegels. Op de lijn staat alleen de gespeelde tijd; het zichtbare woord
„Eindstand” is weggehaald. De twee tegels en het streepje staan dichter bij
elkaar. Controle: `npm run check:build` en visueel op desktop en 390px; op
390px geen horizontale overflow.

## Eindstand weer bovenaan

De grote scoretegels staan weer direct onder de ploegnamen. Daaronder loopt de
doelpunttijdlijn terug van de laatste goal via rust naar de aftrap onderaan.
Minuten, tussenstanden en dwarslijnen blijven op de centrale as. De volgorde
in [wedstrijden.md](../architectuur/wedstrijden.md) is bijgewerkt. Controle:
`npm run check:build`, `npm test`, AZ en een 0–0 in de gebouwde HTML, en AZ
visueel op desktop en 390px.

## Doelpunten lopen naar de eindstand

De wedstrijdkaart begint nu met de ploegen en een aftrapmarkering. Op de
centrale as volgen de doelpunten chronologisch met minuut en tussenstand;
dwarslijnen verbinden de stand met de maker links of rechts. De ruststand staat
op de as en de grote scoretegels sluiten als eindstand af, ook bij 0–0. De
afspeelknop en het scrubben blijven dezelfde scoretegels bijwerken. De
documentatie van de wedstrijdpagina is aangepast in
[wedstrijden.md](../architectuur/wedstrijden.md). Controle: `npm run
check:build`, `npm test` (32/32), AZ en een 0–0 in de gebouwde HTML, plus de
AZ-pagina visueel op desktop en 390px. Op 390px is er geen horizontale overflow.

## Compactere seizoenstelling

De W/G/V-tellers boven het archief tonen cijfer en letter nu als losse elementen met 2px ertussen. Space Mono Bold maakt ze nadrukkelijker; de tegels hebben iets minder zijruimte. De vormblokjes en het animatietempo blijven gelijk. Controle: `npm run check:build`.

## Departure Mono verwijderd

Departure Mono is uit de fontbestanden, de CSS-fontdefinities, preload en de System-proeven verwijderd. De ticker en dock gebruiken nu JetBrains Mono via de bestaande `font-pixel`-utility; celmaten en animatietempo zijn niet aangepast. De ingesloten bloktekens van het oude font zijn ook verwijderd. Controle: `npm test`, `npm run check:build` en `npm run check:build -- --development`.

## Thuis/uit verwijderd van de home

De homepage toont geen aparte aanduiding `Waar`, `Thuis`, `Uit` of `T/U` meer bij het programma en het wedstrijdarchief. De ploegvolgorde in het programma geeft thuis en uit aan. De archiefrijen gebruiken de vrijgekomen ruimte voor de tegenstander. Controle: `npm run check:build`.

## Kleine labels weer in JetBrains Mono

Op verzoek zijn de teksten tot circa 14px, waaronder labels, tags, rugnummers en kleine waarden, weer in JetBrains Mono gezet. Space Mono blijft op de grotere waarden, uitslagen en aftelklok. Het contrast van de gedempte labels is iets verhoogd voor betere leesbaarheid. Controle: `npm run check:build`; desktop en 390px op de home visueel bekeken.

## Eén monofamilie voor SCC-data

De SCC-pagina's combineren nu Neue Montreal voor tekst en namen met Space Mono voor labels, data, cijferwaarden, kleine tags, scoretegels en de aftelklok. Space Mono Regular is lokaal toegevoegd naast Bold. De klok houdt zijn bestaande tempo; alleen het lettertype en de vaste maten zijn aangepast. JetBrains Mono en Departure Mono blijven beschikbaar voor het oorspronkelijke design system en onderdelen buiten de SCC-pagina's. De fontrollen staan in [system.md](../paginas/system.md) en [wedstrijden.md](../architectuur/wedstrijden.md). Controle: `npm run check:build`; desktop en 390px op de home visueel bekeken.

## Uitslagen in Space Mono Bold

De uitslagen en scoretegels gebruiken nu lokaal geladen Space Mono Bold: grote cijfers met een monobrede, afgeronde displayvorm. De archiefrij, scorekaart, ruststand en kleine scorechip delen dit font. Kleine chips en speleractietags staan in JetBrains Mono; Departure blijft voor bordlabels en de aftelklok. De bron en OFL-licentie van Space Mono staan in `src/assets/fonts/`. Basics toont de nieuwe rol. Controle: `npm run check:build`.

## Hero op de home: aftelklok en donkerblauw programma

Het blauwe paneel heeft onderaan een aftelklok tot de aftrap (klaptegels, `text-pixel-3`, vanaf xl `-4`), met datum, aftrap en thuis/uit als gewone Montreal-tekst ernaast (md en vanaf xl) of eronder (telefoon en lg, waar het paneel naast `> Daarna` te smal is); die waren eerst ook klaptegels, maar dat was te druk. De klok tikt per seconde in `src/js/components/scc-upcoming.js`, toont na de aftrap twee uur `Bezig` en leest per minuut voor (`role="timer"`, `aria-label`). `upcomingRows` geeft nu ook `venue` (Thuis/Uit). `> Daarna` staat op donkerblauw, rijen op twee regels zonder afkappen. Controle: `npm test` 32/32, `npm run check:build` geslaagd, screenshots op 390, 1024 en 1440px, ook de stand `Bezig`.

## Acties rechts op de naamregel

In `.scc-ratings` (container query, vanaf 520px tabelbreedte) staan goal-, assist-, kaart- en wisseltags op dezelfde regel als de naam, rechts uitgelijnd voor de minuten; smaller staan ze zoals voorheen onder de naam. Op 1280px past dat in de halve kolom, op 1024px (±464px) nog niet. `npm run check:build` geslaagd; niet visueel gecontroleerd.

## Opstellingen over de volle breedte, beide ploegen op één veld

De wedstrijdpagina heeft geen zijkolom meer. `.scc-body` is vanaf lg een grid met twee kolommen: Doelpunten (met Kaarten en VAR) links, Cijfers rechts; zonder teamcijfers beslaat Doelpunten de volle breedte. De video (Samenvatting) staat als eerste, over de volle breedte; daaronder Doelpunten en Cijfers, en onderaan, over de volle breedte (`.scc-wide`), Opstellingen. Opstellingen: per ploeg een rechtopstaande speelhelft (`pitchHalf(team)`) met daaronder de tabel; vanaf lg staan de ploegen naast elkaar, eronder de legenda, onder lg staat het veld bij zijn tabel (veld, tabel, veld, tabel, legenda; `pitch(teams)` blijft voor de stijlpagina; per ploeg het doel onderaan, de middellijn met halve cirkel bovenaan, beide ploegen vallen omhoog aan, de tegenstander met witte nummertjes), de legenda, en daaronder vanaf lg twee ploegen naast elkaar (`.scc-lineup-teams`) met dezelfde accordiontabel (`ratings(team)`, nu ook voor de tegenstander, met trainer en formatie in de kop). Ploegen zonder veldplekken (bekerwedstrijd tegen RKC) staan niet op het veld; dan ontbreekt het veld en staat per ploeg `lineupList` boven de tabel. De invallers op het veld zijn vervallen: ze staan in de tabel. Het rapportcijfer naast het nummertje staat aan de aanvalskant en valt onder sm weg. De tegenstander gebruikt dezelfde veldaanname (kolom 1 = eigen linkerflank), dus zijn linkerflank ligt onder. Controle: `npm run check:build` geslaagd, 39 van 40 pagina's tonen twee ploegen op het veld; niet visueel gecontroleerd (geen dev-server), met name de breedte van de tabelrijen op lg (half) en de afstand van het cijfer bij de spitsen naar de middenlijn.

## Verloop: kleinere playknop, witte Cambuurscores

`.scc-strip-play` is 28px (was 44/48) en donker (`--fg` 22% op `--page-bg`, driehoek gedempt). De scorepil van een Cambuurdoelpunt op het verloop is wit met zwarte letters in plaats van geel. Beide in `src/css/components/scc-ui.css`; niet visueel gecontroleerd.

## Vorige/volgende-kaarten

De kaarten onderaan een wedstrijd tonen nu richting en datum (`30 AUG 2026`), de tegenstander, en de uitslag als `scc-chip` in de uitslagkleur met thuis/uit en competitie; een streep van 4px aan de buitenkant heeft dezelfde kleur. De uitgerekte score bij „vorige” kwam doordat de grid de chip over de hele breedte uitrekte; de kaart staat nu op `justify-items-start`. Gegevens via de nieuwe filter `sccMatchRow` (de geëxporteerde `row` uit `scc-archive.js`). Controle: `npm run check:build` geslaagd, screenshots op 1440 en 390px.

## Scheidsrechter alleen met naam

`refereeName` in `src/lib/scc-match-view.js` haalt ", Netherlands" achter Nederlandse scheidsrechters weg; buitenlandse houden hun land. Controle: `npm test` 32/32.

## Rugnummers zwart met wit

De rugnummerbolletjes (`.scc-shirt`) zijn niet meer geel met een blauwe rand maar bijna zwart met een wit Departure-cijfer en een dun licht randje, ook op het veld; hover keert om naar wit. De tegenstander in de tabel is een open ring. Controle: `npm test`, `npm run check:build`, screenshot op 1440px.

## Compact verloop, gegevens boven de uitslag

Het verloop is lager (banen van 18px, balk van 10px, geen legenda-rij) en begint met een ronde playknop (`.scc-strip-play`); de lijn zelf staat in `.scc-strip-field`, en `scc-match.js` meet het scrubben daarop. De gegevens (datum, aftrap, stadion, scheidsrechter) staan niet meer in blokjes onder de uitslag maar als één regel erboven; op een telefoon alleen datum en aftrap. De punten staan in de statusregel (`FT · Gelijkspel · +1 pt`). Controle: `npm test` 32/32, `npm run check:build` geslaagd, screenshots op 1440 en 390px.

## Fellere uitslagkleuren, paars voor gelijk

Winst is fel neongroen (`--result-winst` #2bff88, donkere tekst erop), verlies helder rood (`--result-verlies` en `--scc-red` #ff3b4e) en gelijk paars (`--result-gelijk` #a77bff): oranje richting geel zou botsen met het Cambuurgeel, paars staat los van goed/slecht. Dezelfde kleuren gelden voor `data-tone` pos/neg, het verloop, de vorm, de streep per rij, de hero, de wisselpijltjes op het veld en de rapportcijferbanden goed en onvoldoende. Controle: `npm test`, `npm run check:build`, screenshots op 1440px.

## Liggend veld en spelerstegels

Het veld ligt nu over de hele rechterkolom (520px, was 440): Cambuur speelt naar rechts, de linkerflank boven. Spelers zijn kleine ronde nummertjes (`.scc-shirt`) met het cijfer rechts ernaast, en hetzelfde nummertje staat in de rapportcijfertabellen. De uitgeklapte spelergegevens zijn tegels met label, getal, toelichting en waar mogelijk een meter in een toon; `playerCard` in `scc-match-story.js` geeft daarvoor `share` en `tone` per cijfer mee. Let op: Nunjucks' `rejectattr` kent geen vergelijking, filter in de lus. Controle: `npm test` 32/32, `npm run check:build` geslaagd, screenshots op 1440 en 390px.

## Kleinere uitslag, ruststand eronder

De klaptegels in de hero zijn een maat kleiner (`text-pixel-8`, xl `-12`). De ruststand staat klein onder de uitslag (`.scc-board-half`, op een telefoon onder de ploegen) en niet meer in de gegevensrij, die vanaf lg vijf kolommen heeft. Controle: `npm test`, `npm run check:build`, screenshots op 1440 en 390px.

## Groter, zonder kapitalen

Montreal-teksten staan niet meer in kapitalen en zijn groter: sectiekoppen
32/40px, ploegen in de hero 34/44/56px, het programma 44/64/88px, het
verslag 20/24px, gegevens, kerncijfers, doelpuntmakers en
rapportcijfernamen een stap omhoog. Op de home zijn de wedstrijdrijen
hoger (72/80px), met tegenstanders op 24/30px, datum en T/U vanaf md op
22px en de uitslagtegel op 22/33px. De seizoenstitels zijn juist kleiner
(36/48/56px). Departure Mono blijft in kapitalen (`font-pixel`).
Controle: `npm test` 32/32, `npm run check:build` geslaagd, screenshots op
1440 en 390px.

## Klaptegels effen en wit

Op verzoek: klaptegels zonder naad in het midden (ook geen tweekleurig
vlak meer), altijd witte tekst en altijd Departure Mono. De uitslag in de
hero staat nu op `text-pixel-12`/`-16`, op een telefoon `-4`; de gele
Cambuur-cijfers en de gekleurde uitslagen in de lijst zijn vervallen (de
kleur zit in de streep en de naam). Tokens `--flap-bg-low` en
`--flap-seam` verwijderd. Controle: `npm test` 32/32, `npm run
check:build` geslaagd, screenshots op 1440 en 390px.

## Donker, zwaarder, terminal en vertrekbord (20 oktober 2026)

Tweede ronde op de nieuwe vormgeving. Alleen nog donker (`color-scheme:
dark`, de lichte tokens en `prefers-color-scheme`-regels zijn weg, ook in
`theme/typography.css`); alle tekst zwaarder (`--weight-grade` 40,
gewichten in de SCC-CSS een stap omhoog, koppen extrabold en vaak in
kapitalen). Hoeken van 16 naar 4px, pillen nu rechthoekig. Nieuw:
`.scc-term` (terminalregel met gele prompt en knipperende cursor, ook
voor sectiekoppen) en klaptegels (`flap`, `flapText`, tokens
`--flap-*`). De hero van de wedstrijdpagina is een vertrekbord in één
paneel: terminalregel, ploegen in kapitalen met de uitslag in grote
klaptegels, gloed en lijn in de uitslagkleur, gegevens als label en
waarde, het korte verslag als vette lead en het verloop. De aparte
metaregel en de sectie Verslag zijn vervallen; de video staat als
Samenvatting in de linkerkolom. Doelpunten en het programma op de home
zijn vertrekborden; uitslagen in de lijst klaptegels in Departure.
`scc-upcoming.js` bouwt de tegels van datum en tijd opnieuw op. Dock en
ticker niet aangeraakt: die gebruiken nog Tailwinds `dark:`-variant
(`prefers-color-scheme`) en volgen bij `dock: true` dus nog de
systeeminstelling; dat hoort bij de dock-specialist.

Controle: `npm test` 32/32, `npm run check:build` (productie en
`--development`) geslaagd; screenshots op 1440px en 390px (iframe).
Geen commit, push of deploy uitgevoerd.

## Nieuwe vormgeving (20 oktober 2026)

Op verzoek de hele stijl omgegooid; alleen Neue Montreal en Departure
Mono zijn gebleven. Geen raster, geen LED-scorebord meer: effen warme
ondergrond, kaarten met haarlijn en ronde hoeken, Montreal voor koppen en
grote cijfers, Departure alleen als klein label. Herbruikbare
primitieven (`.scc-card`, `.scc-eyebrow`, `chip`/`.scc-chip`,
`.scc-stat-card`, `.scc-meter`) en één kleursysteem via `data-tone`
(pos/neutral/neg/scc/info/muted/ink), waarop `data-result` en
`data-state` aansluiten; de kerncijfers kleuren naar gunstig of
ongunstig. Nieuwe indeling: home met een programmakaart en per seizoen
cijfertegels naast de wedstrijdlijst; wedstrijdpagina met scorekaart,
verloop en kerncijfers, daarna vanaf xl twee kolommen (verhaal links,
opstelling en rapportcijfers rechts). De data is ongewijzigd. Het
meetraster staat alleen nog op `/system/` (`grid: true`). `data-result`
is van `<main>` op de wedstrijdpagina gehaald (tonen erfden door).
Aangepast: `theme/colors.css` (tokens, uitslag- en cijferkleuren),
`layouts/base.njk`, `core.js`, `scc/view/index.njk`, `match.njk`,
`partials/scc/ui.njk`, `components/scc-ui.css`, `pages/scc.css`,
`scc-upcoming.js` (klasse van een rij), `system/components.njk` en
`system.11tydata.js`. Dock, ticker en animatietempo niet aangeraakt.

Controle: `npm test` 32/32, `npm run check:build` (productie en
`--development`) geslaagd. Screenshots via headless Chrome van een
tijdelijk statisch geserveerde controlebuild op 1440px (licht en donker)
en 390px (in een iframe: headless Chrome heeft een minimale
vensterbreedte van ongeveer 500px, dus `--window-size=390` geeft een
afgesneden beeld). Geen commit, push of deploy uitgevoerd.

## Korte wedstrijdroutes

De detailpagina's gebruiken nu alleen de bestandsnaam als route, bijvoorbeeld
`/2026-10-18-az/`. De `data.json`-uitvoer, interne links en sitemap volgen
dezelfde `matchUrl`. Het seizoen blijft onderdeel van de bronmap en de
wedstrijdgegevens, maar staat niet meer in de URL.
Controle: `npm test` (32/32) en `npm run check:build` geslaagd. De tijdelijke
build bevat `/2026-10-18-az/`, de bijbehorende `data.json` en de korte
route in de sitemap; oude seizoensroutes komen niet meer in de HTML voor.

## Vertrekbord voor komende wedstrijden

De onderste lijst gebruikte op brede schermen 16px ruimte tussen kolommen
bij 24px blokjes. De afstand is nu één rastercel; de drie kolommen beginnen
op rasterlijnen. `Willem II` en `SC Cambuur` krijgen per schermmaat een
letterafstand waardoor het begin van elk teken een geheel aantal cellen
opschuift (16px op `xl`, 4px op `md`, 2px op telefoon). Op breed desktop
zijn de kolom- en letterposities in de browser gemeten en visueel bekeken.

De ploegnamen op het homebord schalen nu met het vierkante raster:
22px tekst bij 8px cellen op telefoon, 44px bij 16px vanaf `md` en
88px bij 24px vanaf `xl`. Kop, datum en tijd groeien op `xl` naar 33px.
De regelhoogtes zijn per schermmaat veelvouden van de celmaat. Visueel
gecontroleerd op 390px, 900px en breed desktopformaat. De competitiecontext
blijft op telefoon 11px om op één regel te passen.

Het bord heeft nu één vierkant raster over de hele oppervlakte en een
doorlopende buitenrand. Bovenaan staan `Volgende wedstrijd` en de
competitie/ronde. De aanduiding `Uitwedstrijd`, `SC Cambuur / Programma`
en de voetregel zijn verwijderd. De primaire teksten zijn 22px; op
mobiel lopen de volgende wedstrijden onder elkaar. De desktoprijen zijn
48px hoog en sluiten op het raster van 24px aan. Onder de vertreklijst
staat één lege rij vierkante rastercellen. Gecontroleerd in de
bestaande lokale browser op desktop en 390px breed.

Controle: `npm test` (32/32) en `npm run check:build` geslaagd. De
dagelijkse verversing wordt door Netlify Scheduled Functions uitgevoerd
na een productie-deploy. Hiervoor is geen GitHub-workflow nodig; op de
Netlify Functions-pagina moet dan `Scheduled` zichtbaar zijn. Geen commit,
push of deploy uitgevoerd.

De titel en inleiding op `/` zijn vervangen door een LED-bord met de
eerstvolgende Cambuurwedstrijd groot, met vier volgende wedstrijden als
vertreklijst. De vierkante blokjes volgen het detailbord. Datum, tijd,
ploegen en competitie/ronde zijn zichtbaar; er is geen uitslag.
Bij een lege lijst staat `SC Cambuur`.

De beginstand in `src/scc/upcoming.json` bevat vijf echte wedstrijden van
het officiële clubprogramma, vanaf Willem II–Cambuur op 24 oktober 2026,
inclusief de bekerwedstrijd bij VV Kloetinge. De build leest alleen deze
JSON. Netlify serveert de actuele lijst uit Blobs en controleert dagelijks
of de eerste speeldag voorbij is. Pas dan haalt de geplande functie met
één verzoek het nieuwe clubprogramma op. Bij een lege lijst geldt zeven
dagen wachttijd. Een oudere lege Blob krijgt geen voorrang boven de
meegepubliceerde beginstand. De homepage gebruikt geen API-Football-quota
of sleutel. De lokale opdracht `npm run scc:upcoming` volgt dezelfde
verversingsregel. De dock en het animatietempo zijn niet gewijzigd.

API-Football Free kan een komende wedstrijd via `headtohead` tonen wanneer
de tegenstander bekend is, maar de geteste routes om die tegenstander
automatisch te ontdekken werden geweigerd. Zie
[api-football.md](../integraties/api-football.md#komende-wedstrijden-op-de-homepage).
Controle: `npm test` (32/32), `npm run check:build`, bundeling van beide
Netlify-functies en `npm run scc:upcoming` geslaagd. Die laatste opdracht
deed terecht geen netwerkverzoek vóór de speeldag. Geen commit, push of
deploy uitgevoerd.

De SCC-site is uit de oorspronkelijke persoonlijke site afgesplitst. `src/scc/` bevat 40 verslagen en 40 opgeslagen fixture-responsen; de startpagina toont het overzicht en per wedstrijd is HTML en `data.json` beschikbaar. De persoonlijke home, Instagram en weerfunctie zijn verwijderd. De mono-stijl, het raster, de dock en de Eleventy-assetopbouw zijn behouden.

Controle: `npm run check:build` bouwt naar een tijdelijke map; `npm test` controleert de SCC-helpers en dock. Externe GitHub-, Netlify- en domeininstellingen zijn nog niet geconfigureerd. De gebruiker beheert commits, pushes en deploys.

## Basics en Typography hersteld

Departure Mono was al aanwezig als fontbestand en in de gebouwde CSS. De lokale fontproef ontbrak. Basics en Typography zijn met de benodigde systemlayout, codeweergave en meet- en kopieerlogica teruggezet. `npm run check:build -- --development` toont beide routes; de productiebuild houdt ze buiten de site.

## Docktekst op het overzicht

Op het SCC-overzicht ontbrak de `await`-state die de oorspronkelijke home gebruikt. Daardoor verscheen de live-klok in plaats van de wachtmelding. De dock-specialist heeft `console: await` op het overzicht gezet en de wachtregels voor deze repo teruggebracht: `SYSTEMS READY · AWAITING INPUT`, klok, tijd zonder invoer, hover, sessieduur en `STDIN OPEN · LISTENING`. Weer, avatar en RENDER TEXT horen niet bij deze pagina. De fontbestanden, dock-CSS en het tickertempo zijn ongewijzigd. Controle: tijdelijke productiebuild, 19/19 tests en breedtes van 16/24/36/64 cellen geslaagd.

## Vormgevingsvoorstel overzicht en wedstrijdpagina

Op 20 oktober 2026 een eerste vormgeving gebouwd. Nieuw: grote Departure-maten (`text-pixel-4` t/m `-16`, `pixel-cap`), kleuren `--scc`, `--result-*` en `--rating-*`, leeslagen `scc-match-story.js` en `scc-archive.js`, macro's in `partials/scc/ui.njk`, CSS in `components/scc-ui.css` en `pages/scc.css`, JS in `components/scc-archive.js`, `scc-match.js` en `modules/scc/effects.js`, en `/system/components/`. Dock, ticker en het bestaande animatietempo zijn niet aangeraakt. Details: [wedstrijden.md](../architectuur/wedstrijden.md#vormgeving-herzien-20-oktober-2026).

Controle: `npm test` 24/24 (5 nieuwe tests in `tools/tests/scc-match-story.test.mjs`), `npm run check:build` en `-- --development` geslaagd. Screenshots via headless Chrome op 1440 en 390px, licht en donker, van een tijdelijk statisch geserveerde controlebuild (de draaiende dev-server had de nieuwe filters nog niet geladen: na `eleventy.config.js`-wijzigingen `npm run dev` herstarten).

## Tweede ronde: LED-bord, dikke lijn, clubkleuren en tabellen

Op verzoek: score als LED-bord in dockstijl (`text-pixel-24` erbij), de stand-strook onder het bord als tijdlijn met goals, kaarten en VAR (afspelen bij laden, scrubben), de aparte tijdlijnsectie vervallen, Cambuur geel/blauw en de tegenstander in shirtkleur of rood (`--opp`), teamcijfers en rapportcijfers als tabellen op het raster, en op de home het bord in dockstijl (balk boven de dock onder xl) met extra scrolleffecten. De dock is niet aangepast; de aansluiting (`#scc-match-data`, `scc:moment`, `scc:match`) staat in wedstrijden.md. Controle: `npm test` 26/26, `npm run check:build` geslaagd, screenshots op 1440 en 390px, licht en donker.

## Derde ronde: brutalistisch, Cambuur centraal

Tegengoals wit met zwart, rood alleen voor achterstand en rode kaarten; de shirtkleur van de tegenstander is vervallen. Bord met gespeelde minuten, ruststand in het midden, punten rechts en op mobiel een rij per ploeg. De strook is lager, met de minuten in de balk; standaard eindstand met "Speel af". Feiten als kaarten, tabellen in kaders met vette Montreal, opstelling alleen Cambuur (zonder veldplekken per linie), tegenstander ingeklapt, vorige/volgende met een klein LED-bordje. Home zonder meelopend bord, met totalen als kaarten, register-panelen en "In cijfers". Geen tekst noemt nog de databron. Controle: `npm test` 25/25, `npm run check:build` geslaagd, screenshots op 1440 en 390px.

## Home per seizoen

Totaalkaarten en "In cijfers" van de home verwijderd. Elk seizoenspaneel heeft nu vier eigen cijfers (`archive(...).groups[].stats`): topscorer(s), hoogste gemiddelde, de nul en kaarten. Bekerrijen tonen groen `✓ Door` of rood `✗ Uitgeschakeld` (`row.advanced`). Controle: `npm test` 26/26, `npm run check:build` geslaagd, screenshots op 1440 en 390px.

## Grotere typografie en dock tijdelijk uit

Overzicht groter en vetter: titel tot `text-5xl` (132/120, nieuw in `theme/typography.css`), seizoenstitels tot `text-5xl`, tegenstanders in extrabold tot `text-3xl` met een regel van 72px (staarten blijven heel), rijen van 96px, uitslag `text-pixel-4`, W/G/V-blok 48px, seizoenscijfers tot `text-pixel-8`. De dock staat uit via `site.dock` (`src/data/site.js`); `layouts/base.njk` zet dan alleen 96px ruimte onder de pagina. Dock-, ticker- en consolebestanden zijn niet aangepast. Controle: `npm test`, `npm run check:build`, screenshots op 1440 en 390px.

## Uitslagkleuren, feiten en doelpuntbalken

Winst groen, gelijk oranje, verlies rood (`--result-*`). Home: rand links per rij in die kleur, uitslag in een zwart kader, geen W/G/V-blok meer, seizoenstitels een stap kleiner. Wedstrijd: scheidsrechter rechtsboven, strook direct onder het bord, vijf gelijk opgebouwde feitenkaarten, doelpunten als balken onder elkaar, tegenstander altijd uitgeklapt. Controle: `npm test`, `npm run check:build`, screenshots op 1440 en 390px.

## Spelers als accordion, strakkere hover

De popover per speler is vervangen door uitklaprijen in de rapportcijfertabel; het veld linkt ernaar. Hover op het overzicht en op de vorige/volgende-kaarten keert om naar zwart met wit in plaats van geel met blauw. De seizoenstelling toont W, G en V in de uitslagkleuren. Op mobiel staan uitslag en punten weer naast elkaar onder het bord. Controle: `npm test`, `npm run check:build`, screenshots op 1440 en 390px.

## Scorebord en blessuretijd

Rond de uitslag op het bord nu echt één vierkante cel boven en onder (de regelhoogte van `text-pixel-16`/`-24` wordt in `.scc-board-score` overschreven); het bord is acht rijen hoog. "Speel af" staat altijd zichtbaar onder de lijn. Klok en lijn tonen 90 plus blessuretijd (`status.extra`, anders het laatste moment na 90′, anders `90′+`), met de blessuretijd gearceerd op de lijn. Geen extra front-matterveld. Controle: `npm test` 30/30, `npm run check:build`, screenshots op 1440, 900 en 390px.

## Opstelling: groen veld en compacte tegenstander

De lijn kleurt de stand nu in de W/G/V-kleuren (groen voor, oranje gelijk, rood achter). Opstelling: links een klein groen veld (320px, sticky vanaf lg) met alleen rugnummers, het cijfer eronder en iconen voor goal, kaarten, in en uit; de invallers op een rij eronder. Rechts Cambuur en de tegenstander even breed; de tegenstander compact zonder uitklap (`ratings(team, true)`, macro `ratingLine`), vanaf xl in twee kolommen. Controle: `npm test` 32/32, `npm run check:build`, screenshots op 1440 en 390px.

## Teamcijfers: label in het midden

Elke rij in de teamcijfers (`stats` in `ui.njk`) toont nu de waarden aan de buitenkant en het label gecentreerd, op alle breedtes dezelfde opbouw. Daaronder per kant een goot met een balk die vanuit een middenstreepje groeit; wie voorstaat heeft een gevulde balk en de waarde in een blokje (Cambuur geel/blauw, tegenstander wit), de ander een gearceerde balk. Animatie ongewijzigd. Controle: `npm run check:build` geslaagd, screenshots op 1440 en 390px.

## Eén regel en minuten in het verloop

Doelpuntpillen in het verloop (`strip`) braken bij een stand als `1–0`
over twee regels omdat het klikvlak 32px is; de pil is nu `nowrap` en
steekt gelijk aan beide kanten uit. Naast elk teken staat de minuut in
Departure (`.scc-strip-minute` in `ui.njk`/`scc-ui.css`), vanaf 70% van
de as links van het teken; onder `sm` alleen bij doelpunten. De
baanafstand in `stripMoments` is van 0,075 naar 0,12 gegaan. De regels
onder `Daarna` op de home staan altijd op één regel (afkappen in plaats
van afbreken); het bord heeft daarvoor `grid-cols-[minmax(0,1fr)]` onder
lg. Let op: headless Chrome rendert minimaal 500px breed, dus een
schermafdruk op 390px is afgeknipt. Controle: `npm test` 32/32, `npm run
check:build`, schermafdrukken op 1440, 800 en 500px.

## Tegendoelpunten rood

In de doelpuntenlijst (`.scc-goal` in `scc-ui.css`) krijgt een tegendoelpunt
een rode streep links en de stand in `--scc-red`; Cambuur-goals houden de
gele streep. Controle: `npm run check:build` geslaagd.

## Videocontrole

De build controleert per wedstrijd via YouTube-oEmbed of de video nog
bestaat (`src/lib/scc-video.js`, computed `videoAvailable`). Niet
beschikbaar (401/403/404) betekent: geen embed, geen videolabel, `videoUrl`
leeg in de JSON. Netwerkfout betekent: video blijft staan. De ADO-video
(2026-09-19) geeft 401 en wordt dus verborgen. Controle: `npm test` 32/32,
`npm run check:build`.

## Doelpuntmakers in de hero

De doelpunten staan nu als kleine verticale tijdlijn onder de ploegen in het bord (`board` in
`ui.njk`, `.scc-board-line` in `scc-ui.css`): thuis links, uit rechts, stand en rust op een lijn in het midden, met dezelfde inhoud als de
sectie Doelpunten: minuut, naam, soort, assist of strafschop en stand. Die
sectie is van de wedstrijdpagina gehaald; Cijfers staat nu onder
Opstellingen en Kaarten en VAR is een eigen lijst eronder. Controle: `npm run
check:build` en `npm test` geslaagd; niet visueel bekeken in een browser.
