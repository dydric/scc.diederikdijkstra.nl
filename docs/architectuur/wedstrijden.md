# Wedstrijdcollectie

Opgezet op 19 oktober 2026 uit de door de gebruiker aangeleverde tekst
over Cambuurs promotieseizoen. Er zijn eenvoudige
overzichts- en wedstrijdpagina's om de collectie te bekijken.

## Opstelling als 3D-veld (22 oktober 2026)

De speelhelften gebruiken hetzelfde procedurele WebGL-gras als de hero
(`js/modules/scc/turf.js`). De shader kent nu een algemene uitsnede
(`basis` en `origin`, schermcoördinaten naar veldmeters); een paneel met
`data-turf-view="half"` tekent een staande helft van 73 bij 65 meter: doel
met 2,5 meter uitloop onder, middellijn tien meter onder de bovenrand.
De lampen hangen dan achter de bovenrand; licht (avond/middag) volgt
`data-kickoff`, dat `pitchHalf(team, kickoff)` uit de fixture meekrijgt.
De opkomst van het licht speelt eenmaal per tabsessie per kant
(`opstelling-home`, `opstelling-away`). Voor een gekanteld paneel meet de
module met `offsetWidth`/`offsetHeight`, niet met de getransformeerde box.

Opbouw (`ui.njk`, `pitchHalf` en `pitchPlayer`; opmaak in `scc-ui.css`):
`.scc-pitch` (perspectief) met `.scc-pitch-plane`, gekanteld met `--tilt`
(46°, onder 640px 34°). Daarin `.scc-pitch-ground` met het canvas en de
CSS-lijnen als reserve zonder WebGL, een grondplak als voorkant
(`.scc-pitch-edge`), een staand doel met net en de spelers. Elke speler
(`.scc-node-stand`) draait even ver terug en staat dus rechtop naar de
kijker: een matzwarte ledtegel zoals het scorebord in de hero, met het
rugnummer (Cambuur geel, tegenstander warmwit) en het rapportcijfer als
strook in zijn bandkleur. Rechtsboven als badge: een bal per goal,
kaartjes, en ↓ met minuut bij een wissel. Op het gras een contactschaduw
en een lichtvlek in de ploegkleur. Geen namen op het veld; die staan in
title, aria-label en de tabel.

Bij in beeld (`data-reveal`) klappen de tegels vanaf het gras omhoog,
620ms met lichte overshoot, vertraagd van keeper naar spits; hover tilt de
tegel 6px op met een gloed. Met `prefers-reduced-motion` staat alles direct.
Bekeken in headless Chrome op 1440 en 390px (AZ, Telstar).

## Eigen doelpunten in het wedstrijdverloop (22 oktober 2026)

In de opgeslagen API-respons staat `event.team` ook bij een eigen doelpunt
voor de ploeg die ervan profiteert. De tijdlijn en archiefstatistieken
gebruiken die ploeg voor de tussenstand en de kleur. De maker en zijn
markering staan aan de kant van zijn eigen club: bij een eigen doelpunt is
dat de andere kant. De wedstrijd Jong AZ – SC Cambuur (25 augustus 2025)
toont daardoor na de 16e minuut 0–1 en een groene voorsprong voor Cambuur,
met N. Twisk aan de kant van Jong AZ.

## Resultaatblokjes en hoververloop op de home (22 oktober 2026)

De seizoensrijen tonen achter de uitslag een blokje van 32px met W, G of V,
in plaats van de punten (+3/+1/+0). De gekleurde linkerstrip is verwijderd.
Hover en toetsenbordfocus schuiven onderaan een 4px hoge kleurstrook omhoog,
met een sterkere, omhoog uitwaaierende gloed per segment. De segmenten komen uit dezelfde
`matchStory(...).states` als het detailbord, inclusief de tijdsverhouding;
zonder wedstrijddata ontbreekt de strook. Er staan geen symbolen of labels in.
In rust is alleen een lichte gloed zichtbaar (16% van de hovergloed).
De 4px strook schuift apart omhoog in 400ms met een zachte uitloop; de
gloed bouwt in 480ms op en dooft bij verlaten rustig terug. Beide
overgangen vervallen bij verminderde beweging. Dit verfijnde tempo is
op verzoek aangepast; overige animaties blijven gelijk.

De hele rij licht bij hover en toetsenbordfocus op met 7% wit over de
donkere ondergrond. Deze achtergrond vloeit in 480ms in en uit, gelijk
aan de bestaande gloed; snel wisselen keert de overgang vloeiend om.
Toetsenbordfocus heeft bovendien een binnenrand. Bij verminderde beweging
wisselt ook de achtergrond direct. Het tempo van strook en gloed blijft gelijk.

Seizoenen en Programma delen `.scc-list-date`: 14px Space Mono en 55% wit.
De notatie is `za 24 okt`, zonder afkortingspunten; het programma houdt
de aftraptijd erachter. De browserverversing gebruikt dezelfde klasse.

## Homehero: focus op de eerstvolgende wedstrijd (22 oktober 2026)

Eén donker paneel met dezelfde blauwe gloed, scanlijnen, kleurstrook en
typografie als het detailbord. Datum en aftrap staan centraal boven de
ploegen. Thuis staat links en rechts uitgelijnd, uit rechts en links
uitgelijnd, met een rustig streepje ertussen. Beide hebben een expliciet
thuis/uit-label en hun eigen stand (indien beschikbaar) en vorm onder de
naam. Onder 640px staan de ploegen gecentreerd onder elkaar, steeds in
dezelfde leesvolgorde: label, naam, stand en vorm. Namen worden niet afgekapt.
De namen groeien met de beschikbare schermruimte: 32px op mobiel, 44px
vanaf md, 64px vanaf lg en 80px vanaf xl, met regelhoogtes van respectievelijk
40, 52, 72 en 88px. Bij een naam langer dan elf tekens schakelen beide
clubtitels samen terug: 24px op mobiel/sm, 32px vanaf md, 40px vanaf lg
en 56px vanaf xl (regelhoogtes 32/40/48/64px). De template en de
browserverversing zetten hiervoor `data-long-names` op het ploegenraster.
Vanaf 640px delen beide ploegen via subgrid de rijen voor thuis/uit, naam
en context. De vormreeksen beginnen daardoor op dezelfde hoogte; het
middenstreepje centreert in de naamrij. Uitzonderlijk lange namen mogen
binnen de kolom afbreken, terwijl beide naamvlakken even hoog blijven.

De aftelklok staat als kleine tekstregel onder de ploegen, zonder zichtbare
tegelachtergronden: `Aftrap over`, dagen, uren, minuten en seconden.
Het bestaande tempo en gedrag na de aftrap blijven gelijk. Datum en tijd
blijven zonder JavaScript zichtbaar. De voorspelling vormt de bovenrand;
groen betekent Cambuurwinst, paars gelijk en rood winst voor de tegenstander.
Zonder voorspelling ontbreekt de strook.

`Programma` is een gedempte compacte lijst met datum/tijd, wedstrijd en
competitie, zonder gekleurde clubnamen, stand of vormblokjes. Op mobiel
staan deze gegevens onder elkaar, vanaf md op één rij. Zowel de statische
Nunjucks-template als de browserverversing gebruikt deze inhoud.

Bouwstenen: `scc/preview.njk`; leesmodel: `src/lib/scc-preview.js`.
`scc-upcoming.js` ververst programma en voorbeschouwing samen vanuit de
publieke Netlify-functie. Zie [API-Football](../integraties/api-football.md#voorbeschouwing-api-en-netlify-21-oktober-2026)
voor beschikbaarheid en quota. De oudere beschrijvingen hieronder zijn
historisch; deze sectie beschrijft de huidige homehero.

## Bronnen

Het overzicht begint met het programma in twee panelen (opzet van
20 oktober 2026). Links, in Cambuurblauw: `> Volgende wedstrijd` met
competitie en ronde, de thuis- en uitploeg groot (Cambuur in geel), en
onder een lijn de aftelklok tot de aftrap in klaptegels (dagen, uur,
min, sec). Datum en aftrap staan als gewone tekst naast de
klok (op md en vanaf xl; op telefoon en lg, waar het paneel smal is,
eronder); klaptegels zijn alleen voor de klok. Na de
aftrap staat er twee uur `Bezig`, daarna verdwijnt de klok tot de
verversing. Zonder JS blijft de klok verborgen. Rechts, in donkerblauw,
`> Daarna` met maximaal vier wedstrijden op twee regels: datum, tijd
en competitie, daaronder de ploegen; er wordt niets
afgekapt. Bij een lege lijst staat er `Nog geen wedstrijden gepland.`
De build gebruikt `src/scc/upcoming.json`; na het laden
vervangt `scc-upcoming.js` dit met de lijst uit de Netlify-functie.
De bron en verversing staan bij
[API-Football en programma](../integraties/api-football.md#komende-wedstrijden-op-de-homepage).

`src/scc/<seizoen>/` bevat één Markdown-bestand per genoemde
wedstrijd. De map `2025-2026/` heeft 31 wedstrijden van 8 augustus 2025
tot en met 24 maart 2026: thuis en uit, plus de bekerwedstrijd tegen
RKC Waalwijk. Dit is de aangeleverde selectie tot de promotie, niet
automatisch een volledige seizoenskalender.

`2026-2027/` bevat negen wedstrijdbestanden van 7 augustus tot en met
18 oktober 2026. Ze hebben alle negen een verslag. De
standaardcompetitie is `Eredivisie`.
De scorevelden staan altijd in volgorde
thuis–uit; afwijkingen tussen aangeleverde koppen en de officiële
uitslagen en de Emmen-speeldatum staan in [controle.md](../workflow/controle.md).

De wedstrijdtekst staat in de Markdown-body. De front matter bevat datum,
ploegen, uitslag en, indien aangeleverd, de YouTube-link. Waar de bron
een videotitel gaf, staat die in `videoTitle`. De bekerwedstrijd
overschrijft de standaardcompetitie `Eerste Divisie` met `KNVB Beker`.
De inleiding, afsluiting en metadata
van het oorspronkelijke promotieverhaal staan apart in
`src/scc/2025-2026/season.json`. De bestandsnaam bevat datum en
tegenstander voor een leesbare URL; de wedstrijdgegevens komen uit de
front matter, niet uit de bestandsnaam.

`src/scc/scc.11tydata.js` geeft alle wedstrijdverhalen het tag
`scc`, zodat Nunjucks ze later via `collections.scc` kan gebruiken.
`permalink: false` voorkomt dat de bronbestanden zelf losse pagina's
worden. De mapdata geeft seizoen en standaardcompetitie.

`matchdata` is standaard `null`; alle veertig bestaande wedstrijden
hebben inmiddels het fixture-ID van hun opgeslagen API-respons.
Cambuur–AZ op 18 oktober heeft bijvoorbeeld `matchdata: 1552195`. Per
wedstrijd staat de volledige respons in
`src/scc/api/<fixture-id>.json`. Eleventy leest die lokale JSON in
`scc.11tydata.js` en biedt het eerste `response`-object als `match` aan
Nunjucks aan, bijvoorbeeld `item.data.match.events` of
`item.data.match.fixture.venue.name`. Zonder ID is `match` `null`.
De API-data wordt niet in Markdown gedupliceerd; een gewone build
vraagt niets bij API-Football op. Zie
[API-Football](../integraties/api-football.md) voor de import.

In `npm run dev` bewaakt Eleventy `src/scc/api/` expliciet omdat de
loader de JSON met `readFileSync` opent. De SCC-helpers onder `src/lib/`
zijn eveneens watchdoelen met een configuratieherstart, zodat
wijzigingen aan de leeslaag zichtbaar worden zonder een losse build.
De Markdown- en Nunjucks-bestanden vallen onder Eleventy’s gewone
templatewatcher. `npm run check:build` schrijft alleen naar een
tijdelijke map en vernieuwt `_site` niet.

## Voorlopige uitvoer

De templates in `src/scc/view/` genereren in dev en build een voorlopig
overzicht op `/`, een pagina op
`/<datum>-<tegenstander>/` en daaronder `data.json` voor
elke wedstrijd. De URL gebruikt de volledige bestandsnaam, omdat
Eleventy's `fileSlug` de datum weglaat en wedstrijden tegen dezelfde
tegenstander anders zouden botsen. Er zijn nu 40 wedstrijdpagina's en
40 JSON-bestanden. De HTML gebruikt de brede werkruimte en typografie
van de oorspronkelijke mono-stijl. In het overzicht staan de sectiekop
en de wedstrijden onder elkaar, ook op brede schermen. De lijst is
gegroepeerd op competitie en seizoen: Eredivisie 2026/2027 en Eerste
Divisie 2025/2026. De bekerwedstrijd staat op datum tussen de
Eerste Divisie-wedstrijden, met het label `KNVB Beker`. Binnen elke groep
staat de nieuwste wedstrijd bovenaan. De wedstrijdpagina toont geen
ruw datablok meer; `data.json` blijft als afzonderlijk bestand
bereikbaar. Deze pagina's staan in de sitemap; de definitieve paginaweergave moet nog
worden ontworpen.

De wedstrijdpagina toont nu ook een eerste leeslaag op de opgeslagen
API-data. `src/lib/scc-match-view.js` berekent winst/gelijk/verlies vanuit
Cambuurs perspectief en toont +3, +1 of +0 competitiepunten als de API
`league.standings` bevestigt. Een bekerwedstrijd krijgt geen
competitiepunten. De pagina toont stadion, lokale aftraptijd, een
leesbaar competitie- en rondelabel en
scheidsrechter waar beschikbaar (Nederlandse scheidsrechters alleen met naam,
zonder ", Netherlands"), een tijdlijn van doelpunten, gele en
rode kaarten en VAR-beslissingen, en een tabel met schoten, balbezit, xG
en hoekschoppen. Ontbrekende statistieken worden weggelaten. De
automatisch berekende sectie `Opvallend` is verwijderd.

Onder het verslag staat een YouTube-embed als `videoUrl` een geldige
`youtube.com/watch?v=`-link met video-ID bevat. Het iframe gebruikt
`www.youtube-nocookie.com/embed/<id>`, laadt lui en heeft een link naar
de video op YouTube als alternatief. `videoTitle` wordt gebruikt als
die aanwezig is; anders krijgt het iframe de wedstrijdtitel. De
embed-URL wordt uit het gevalideerde ID opgebouwd, niet rechtstreeks
uit de front matter overgenomen.
Bij elke build controleert `src/lib/scc-video.js` via YouTube-oEmbed of de
video nog openbaar is (`videoAvailable` in `scc.11tydata.js`). Bij 401, 403
of 404 verdwijnen embed, videolabel in het archief en `videoUrl` in de
wedstrijd-JSON; bij netwerkfouten blijft de video staan.

Het rondelabel komt uit `match.league.round` en de competitie uit de
front matter. `Regular Season - 9` wordt bijvoorbeeld
`Eredivisie - Ronde 9`. De bekerwaarde `2nd Preliminary Round` wordt
`Beker - 2e voorronde`; onbekende API-rondewaarden blijven letterlijk
zichtbaar achter de competitienaam.

Onder `Opstellingen` staan de twee basiselftallen in de volgorde van de
API-opstelling, met rugnummer, linie en gespeelde minuten. De tabel
vertaalt de linie uit `lineups.startXI.player.grid` naar Keeper,
Verdediger, Middenveld of Aanval. De precieze code, bijvoorbeeld
`2:4`, blijft in het leesmodel en de volledige JSON beschikbaar voor
een latere veldweergave. Die code benoemt geen specifieke rol als
rechtsback. Invallers hebben doorgaans geen veldplek en tonen hun
brede API-rol. Als alle elf veldplekken bestaan, wordt de getoonde
formatie uit het aantal spelers per linie afgeleid. Bij de
bekerwedstrijd tegen RKC ontbreken die veldplekken; daar wordt geen
formatie getoond en vallen de linienamen terug op de brede API-rollen.
Per ploeg wordt de trainer getoond als die is ingevuld. Alleen
daadwerkelijk geregistreerde invallers staan onder `Ingevallen`, met
wisselminuut, vervangen speler en speelminuten. De wissels komen uit
`events`, de spelergegevens uit `lineups` en `players`; de koppeling
gebruikt speler-ID en valt bij ontbrekend ID terug op een gelijke naam.
Beschikbare individuele bijdragen (aanvoerder, goals, assists en
kaarten) staan bij de speler. De API-beoordeling staat als `Rating`
in een aparte kolom; ontbrekende en nulwaarden verschijnen als `–`.
Ontbrekende minuten worden als `–`
getoond en niet uit het wisselmoment afgeleid. Ongebruikte reserves
staan niet in deze weergave; ze blijven in de volledige JSON beschikbaar.

De tijdlijn toont alleen de geregistreerde API-gebeurtenissen. Bij
Cambuur–AZ staat Bouahs geel op 24′ en rood op 53′. Tegen Dordrecht
staan Berkhouts gele kaarten op 13′ en 62′, gevolgd door rood op 62′,
in dezelfde volgorde als de API-events. Een oorzaak
zoals tweede geel wordt niet uit eerdere kaarten afgeleid en niet via
extra frontmatter aan de matchdata toegevoegd. Het eigen verslag is
redactionele tekst en blijft apart van de API-data.

Het overzicht toont per competitiewedstrijd de punten van die ene
wedstrijd (+3, +1 of +0). Dat is geen historische ranglijstpositie.
De huidige fixture-JSON bevat geen positie vóór of na de wedstrijd;
een betrouwbare ranglijstverplaatsing vraagt een aparte bron met
historische standen of alle competitieuitslagen en tiebreakregels.

De JSON-uitvoer bevat de wedstrijdmetadata, het gerenderde verslag en
`match`: het volledige wedstrijdobject uit de opgeslagen API-respons of
`null` zolang er geen respons is gekoppeld. `matchdata` is het ID of
`null`. De oorspronkelijke API-respons blijft in `src/scc/api/`.
De importer vergelijkt de datum, ploegen en uitslag in de front matter
met de API-respons. De loader herhaalt die controle tijdens de build.
Ook de zichtbare datum en de datum in `data.json` komen uit de front
matter. De bestandsnaam bepaalt alleen het pad van de pagina.

## Vormgeving (herzien 20 oktober 2026)

Leeslagen: `src/lib/scc-match-story.js` (strook, goals, stand,
teamcijfers in groepen, veld, rapportcijfers; via `matchView(...).story`)
en `src/lib/scc-archive.js` (filter `sccArchive`). `sccNeighbors` geeft
vorige en volgende wedstrijd; `sccMatchRow` (de rij uit het overzicht)
maakt daar de kaartgegevens van. De bouwstenen staan in
`src/includes/partials/scc/ui.njk`, de opmaak in
`src/css/components/scc-ui.css` (bouwstenen en tonen) en
`src/css/pages/scc.css` (opbouw van de twee pagina's); voorbeelden op
`/system/components/`.

**Stijl.** Alleen donker (`color-scheme: dark`, geen lichte modus):
bijna zwart (`--page-bg`) met kaarten een tint lichter (`--surface`),
haarlijnen (`--line`) en kleine hoeken (`--radius` 4, `--radius-sm` 2).
Neue Montreal zwaar (`--weight-grade` 40; koppen extrabold, gewone
schrijfwijze, groot) voor lopende tekst, namen en koppen. JetBrains Mono
voor kleine labels, tags en waarden tot circa 14px; Space Mono voor
grotere data, klokcijfers en uitslagen. De cijfers zijn even breed en
blijven op hun plaats bij het rollen. Geen raster
(alleen nog op de stijlproeven, `grid: true`).

**Terminal en vertrekbord.** `.scc-term`: JetBrains Mono op 11px met een gele
prompt (`>`) en een knipperende cursor (`.scc-term-cursor`, stil bij
`prefers-reduced-motion`). Sectiekoppen krijgen dezelfde prompt.
Klaptegels zijn altijd effen (geen naad): `flap(text)` / `.scc-flap`
is één tegel met een wit Space Mono-cijfer (de grootte volgt de
`font-size` van de ouder; de JS kan het getal laten rollen),
`flapText(text)` / `.scc-flaps` zet elk teken in een eigen tegel met
Space Mono. Kleur hoort naast de tegel (streep, naam,
label), niet in de tegel. `scc-upcoming.js` bouwt de
tegels opnieuw op als het programma ververst.

**Primitieven.** `.scc-card` (kaart), `.scc-eyebrow` (label),
`.scc-chip` / macro `chip(text, tone)` (label in JetBrains Mono),
`.scc-stat-card` (cijfertegel: label, `.scc-stat-big`, vette en zachte
regel), `.scc-meter` (balk met `--value`), `.scc-key` (ploeg met
blokje; Cambuur geel met blauwe rand), `.scc-tag` (actie van een
speler), `.scc-term` en de klaptegels. De macro's gebruiken deze; nieuwe
onderdelen horen ze ook te gebruiken.

**Kleur meldt iets.** `data-tone` zet `--tone`, `--tone-ink`,
`--tone-soft` en `--tone-text`: `pos` (groen, gunstig), `neutral`, `neg`
(rood, ongunstig), `scc` (Cambuurgeel), `info` (blauw), `muted` en
`ink`. `data-result` (winst/gelijk/verlies) en `data-state`
(voor/gelijk/achter) gebruiken dezelfde variabelen, met paars voor
gelijk. Toepassingen: de gloed, lijn en status van de hero, de streep en
de uitslagtegel per rij op de home, W/G/V en de vorm, het verloop, en de
kerncijfers (balbezit boven 52% groen en onder 48% rood; xG groen als
Cambuur ≥ 0,75 boven de verwachting scoorde, rood als het ≥ 0,75 eronder
bleef; op doel vergeleken met de tegenstander; kaarten rood bij een rode
kaart). In de teamcijfers staan de waarden aan de buitenkant en het label
in het midden, met daaronder twee balken in een goot die vanuit een
middenstreepje naar buiten groeien. Wie voorstaat krijgt een gevulde balk
en zijn waarde in een blokje (Cambuur geel met blauw, de tegenstander
wit); de ander een gearceerde balk en een gedempte waarde. Rapportcijfers hebben
een eigen schaal van rood via oranje, limoen en neongroen naar blauw
(`--rating-*`). Zet geen `data-result` op een paginacontainer: de tonen
erven door.

**Wedstrijdpagina.** Kop met merk en navigatie (`siteHeader(around)`).
De hero is één paneel met haarlijnen ertussen: het bord (`board`) toont bovenaan het statische verloop als bovenrand en daaronder alleen datum en
aftraptijd zonder labels, als één gecentreerde regel met een punt ertussen. Op mobiel staan de ploegnamen boven de gecentreerde eindstand, thuis links
en uit rechts, met compacte regelafstand bij meerregelige namen. De 48px
tussenruimte lijnt de namen uit op de binnenranden van de cijferkaders. Tot
en met 400px staan de clubnamen gecentreerd onder elkaar op 24px, boven de
uitslag. Onder 640px staan tussenstand, minuut en doelpuntmaker op één rij: de
stand in een vaste kolom van 56px, de maker rechts daarvan, met de
toelichting onder de naam. Uitgoals spiegelen deze indeling: score rechts,
minuut en maker links daarvan en rechts uitgelijnd. De club van de maker
bepaalt de kant, ook bij eigen goals. De rijen hebben 8px verticale padding en
korte verticale verbindingen van 8px; de zijverbindingen vervallen daar. Vanaf md
staat de eindstand tussen de ploegnamen op dezelfde rij (ploegnamen 14px tot 360px, daarna vloeiend 16–24px op telefoon,
md 44, xl 56px; Cambuur geel). De klaptegels zijn 32px tot 360px, daarna
vloeiend 36–64px, vanaf md 88px en vanaf xl 132px. Er is geen horizontale
scheidslijn onder de ploegen. Het ondoorzichtige streepje tussen de cijfers
ligt op de middenas; de ruimte tussen de tegels biedt plek aan de gespeelde
tijd op 12px, vlak onder het streepje. Onder de eindstand staat de doelpuntenlijn met makers, tussenstanden en
rustmarkering weer zichtbaar. Het compacte verloop bovenaan toont daarnaast
goals, kaarten en VAR op tijdpositie. De eindtijd blijft onder het scorestreepje;
de scoretegels staan vast op de eindstand. Het bord behoudt de gloed en lichte scanlijnen; het verloop vervangt de
oude effen lijn in de uitslagkleur. Daaronder het korte verslag als vette lead (de eerste
regel extrabold), gevolgd door speelronde, stadion en scheidsrechter
in kleine tekst direct boven de haarlijn naar het verloop. Vanaf lg beginnen deze
gegevens onder de verslagtekst en vullen ze die kolom als even brede blokken.
Het verloop (`strip`, binnen `board`) vormt de bovenrand: een balk van 16px
met standkleuren (groen voor, paars gelijk, rood achter) en een schaduw per
segment. Onder de balk staan alleen thuis en uit, samen 52px hoog.
VAR staat bij de betrokken ploeg. De aparte rij met 0′, rust en eindtijd
is verwijderd; de aftraptijd en gespeelde tijd in het bord blijven staan.
Doelpunten vallen op de kleurwissels in de balk; onder `md` is alleen
het balletje zichtbaar, vanaf `md` ook de tussenstand.
Gele en rode kaarten staan op hun minuut. JavaScript verdeelt symbolen die
elkaar raken binnen dezelfde rij en trekt vanaf de werkelijke minuut een
rechte of schuine verbindingslijn. De symbolen en scores hebben geen vast
kader; alleen hover en toetsenbordfocus lichten de klikplek op. De hoogte
groeit niet met het aantal momenten. Hover, focus of klik toont minuut, soort, speler, ploeg en
maximaal één assist; klikken buiten een item of Escape sluit de toelichting.
Eigen goals staan bij de club van de maker, terwijl de standkleur de
profiterende ploeg volgt. De statische weergave heeft geen
afspeelfunctie. De doelpuntenlijn met makers onder de eindstand blijft staan.
Dan vijf kerncijfers
als tegels. Dan de Samenvatting (de video) over de volle breedte. De sectie Doelpunten is vervallen (de `goals`-macro blijft in `ui.njk` en op de stijlproeven). Over de volle
breedte Opstellingen: per ploeg een rechtopstaande speelhelft met naam en formatie
erboven en de tabel eronder; vanaf lg staan de twee ploegen naast elkaar, eronder
de legenda, onder lg is de volgorde veld, tabel, veld, tabel, legenda. Daaronder Cijfers over de volle breedte en Kaarten en VAR als lijst. Het veld is een
gekanteld 3D-diorama (zie [Opstelling als 3D-veld](#opstelling-als-3d-veld-22-oktober-2026)):
het eigen doel vooraan, de middellijn met middencirkel achteraan; beide
ploegen vallen van de kijker af aan met de linkerflank links. Spelers staan
als ledtegel rechtop met rugnummer, rapportcijfer en status. De tabel toont de rapportcijfers met trainer en
formatie, basis en invallers (accordion per speler, per tabel één open via `name`). Zonder
veldplekken (de bekerwedstrijd tegen RKC) ontbreekt het veld en staat de
basiself per linie boven de tabel. Hetzelfde nummertje staat in de tabellen, zodat veld en tabel bij elkaar horen. Onder lg
staat alles onder elkaar. Een uitgeklapte
speler toont de wissel als terminalregel en een tegel per cijfer
(label, getal, toelichting); schoten, passes, duels en dribbels hebben
een meter met een toon (`facts[].share` en `facts[].tone` uit
`playerCard`: op doel ≥ 50% sterk, < 34% zwak; passes ≥ 80/< 65%;
duels en dribbels ≥ 55/< 40%). Minuten staan al in de rij. Een
speler op het veld linkt naar `#speler-<kant>-<id>`; `scc-match.js`
klapt die rij open en scrolt ernaartoe. Onderaan vorige en volgende als
kaarten (`.scc-next-link`): richting en datum, de tegenstander, en een uitslagchip in de uitslagkleur met thuis/uit en
competitie; een streep aan de buitenkant in dezelfde kleur. De volgende
spiegelt vanaf sm naar rechts.

**Overzicht (`/`).** Bovenaan het programma als vertrekbord: links de
eerstvolgende wedstrijd op Cambuurblauw met scanlijnen, een
terminalregel, de ploegen groot (44, sm 64, xl 88px; Cambuur geel) en datum en
aftrap in klaptegels; rechts de wedstrijden daarna, elk altijd op één
regel (datum en tijd in geel JetBrains Mono op 11px, ploegen vet op 16px,
competitie als label; past het niet, dan wordt eerst de competitie en
daarna de ploegen afgekapt). Per seizoen een kop (titel van 36, sm 48, xl 56px, compacte W/G/V-tellers in Space Mono Bold met 2px tussen cijfer en letter, als labels in de
uitslagkleur, doelsaldo en punten, de vorm), dan vanaf lg links een
kolom van vier cijfertegels (sticky; topscorer of gedeelde topscorers
met de volgende twee, hoogste gemiddelde met minimaal een derde van de
wedstrijden en minstens 3, de nul, kaarten) en rechts de wedstrijden in
één kaart (rijen van 72, vanaf md 80px): datum (vanaf md 18px), tegenstander op 24 (md 30px), uitslag als witte klaptegel,
punten, en links een streep in dezelfde kleur. Op een telefoon staan de
tegels twee bij twee boven de lijst. Een bekerwedstrijd heeft een groene
pil `✓ Door` (ook na strafschoppen, `score.penalty`) of een rode `✗ Uit`.
Bij het scrollen verschijnen de rijen en rolt de uitslag. Namen zijn per
speler de langste vorm die in de data voorkomt.

Rapportcijfers hebben vijf banden: onder 6,0 onvoldoende, 6,0–6,4 krap
voldoende, 6,5–6,9 voldoende, 7,0–7,9 goed, vanaf 8,0 uitblinker. De
band volgt het afgeronde cijfer. Elke speelhelft ligt rechtop (aanval omhoog, linkerflank links) en rekent `grid` om: kolom 1 is
de linkerflank (Bouah, rugnummer 2, staat op `2:4` rechts); dat is een
aanname op basis van bekende posities.

**Voor de dock.** De dock zelf is niet aangepast. De wedstrijdpagina
heeft `<script type="application/json" id="scc-match-data">` met
`matchView(...).summary` (ploegen, uitslag, rust, ronde, datum, aftrap,
stadion, scheidsrechter, goals, hoogste cijfer) en blijft beschikbaar voor de dock. De statische tijdlijn stuurt geen
`scc:moment` meer; de dock zelf is niet aangepast.
Het overzicht stuurt `scc:match` (url, datum, tegenstander, stand,
uitslag) voor de rij onder de muis of midden in beeld.

Beweging (`src/js/components/scc-archive.js`, `scc-match.js`,
`src/js/modules/scc/effects.js`) is zonder bibliotheek; zonder
JavaScript of met `prefers-reduced-motion` staat alles in de eindstand.

## Blessuretijd

De blessuretijd van de tweede helft komt uit `fixture.status.extra` in de
opgeslagen respons, of, als dat veld leeg is, uit het laatste moment na
90′ (een ondergrens). Zonder beide toont het bord `90′+`.

Op 20 oktober 2026 ontbrak `status.extra` bij zeven wedstrijden: ADO Den
Haag (21 nov 2025), Jong AZ (20 mrt 2026), Telstar, NEC, ADO Den Haag
(19 sep 2026), PEC Zwolle en AZ. Bij Telstar, NEC en de twee wedstrijden
van 2025/2026 valt een moment na 90′; bij ADO (19 sep), PEC Zwolle en AZ
is de blessuretijd onbekend. Zonder moment na 90′ is hij niet uit de
opgeslagen data af te leiden: `fixture.periods` bevat alleen de
aftraptijden van beide helften. API-Football kan het veld achteraf vullen,
maar de importer haalt een gekoppelde wedstrijd niet opnieuw op.
