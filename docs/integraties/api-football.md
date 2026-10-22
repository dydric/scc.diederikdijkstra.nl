# API-Football: SC Cambuur

## Voorbeschouwing: API en Netlify (21 oktober 2026)

Op verzoek is naast de bestaande wedstrijdimport een dagelijkse, geplande
API-import toegevoegd. Het clubprogramma en zijn verversingsgrens blijven
ongewijzigd. Builds en bezoekers doen geen API-Football-verzoeken.

**Free daadwerkelijk gecontroleerd:** `/leagues?id=88&season=2026` en
`/standings?league=88&season=2026` worden door het abonnement geweigerd.
`/predictions?fixture=1552200` werkt wel: Willem II 0%, gelijk 50%, Cambuur
50%. Dezelfde respons levert via `teams.<kant>.league.form` de vormreeks;
de laatste vijf zijn G–V–V–V–V en G–W–G–W–G, van oud naar nieuw. Dit is
een modelvoorspelling van API-Football, geen zekerheid of bookmakerquotering.
Positie en punten worden uitsluitend uit `/standings` getoond zodra die
beschikbaar zijn; er is geen verborgen terugval op een andere bron.

`src/lib/scc-football-api.js` is de serverclient. `src/lib/scc-preview.js`
controleert en normaliseert standen, vorm en voorspelling. De lokale
momentopname staat in `src/scc/preview.json`; `preview-teams.json` bevat
bekende team-ID's uit de bestaande wedstrijdresponsen. Onbekende ploegen
worden gericht met `/teams?search=` gezocht, alleen in Nederland en met
eenduidige naamkoppeling. PSV en Jong PSV blijven afzonderlijke ploegen.
Een fixture wordt via head-to-head gezocht en gecontroleerd op exacte
aftraptijd, thuis/uit, ploegen, seizoen en (bij Eredivisie) competitie-ID.
Bij een gewijzigde aftrap wordt de voorspelling niet aan de nieuwe datum
gekoppeld voordat opnieuw gecontroleerd is.

Lokaal verversen: `npm run scc:matchdata -- preview`. Dit subcommando vraagt
geen interactieve bevestiging en gebruikt maximaal drie verzoeken per run,
hoogstens één lokale run per UTC-dag. Het bewaart de gevalideerde momentopname
atomair. Bij ontbrekende sleutel stopt het voordat bestanden veranderen.
De bestaande interactieve import voor gespeelde wedstrijden blijft gelijk.

**Netlify:** stel `API_FOOTBALL_KEY` in als geheime omgevingsvariabele voor
Functions in de productiecontext (of alle scopes wanneer het Netlify-plan
geen afzonderlijke scopes biedt). Nooit opnemen in `netlify.toml`, clientcode
of Git. `scc-preview-refresh` draait dagelijks om 03:15 UTC, na de bestaande
programmacontrole van 03:00 UTC. De functie controleert `context.deploy.context` en `published` en werkt
alleen op de gepubliceerde productiedeploy, bewaart
in de sitebrede Blob-store `scc-preview` onder `preview`, en claimt vóór het
ophalen de UTC-dag met een conditionele `onlyIfNew`-write. Dubbele runs en
retries gebruiken daardoor geen extra quota. Een gecrashte run wacht tot
de volgende dag. Zonder sleutel blijft de meegepubliceerde snapshot bruikbaar.
Controleer na eigen deploy in Netlify of de functie `Scheduled` is en of de
logs een verversing melden; activering op Netlify is niet lokaal bewezen.

**Budget:** maximaal drie verzoeken per geplande dagrun. Normaal één
voorspelling en, wanneer toegankelijk, één volledige Eredivisie-stand voor
alle clubs. Een nieuwe fixture of onbekend team kan extra zoekwerk vragen;
bij de limiet volgt de rest een volgende dag. Na een abonnementsweigering
wacht alleen die bron zeven dagen; bij lege/ongeldige data of netwerkfouten
minstens één dag. Er zijn geen directe retries. Tussen verzoeken zit 6,5 s;
de timeout is 5 s per verzoek. Een totaal tijdbudget van 25 s laat ruimte
voor het bewaren binnen Netlify’s limiet van 30 s voor scheduled functions.
Een verzoek begint alleen als wachttijd en timeout nog passen. Zodra de API-header tien of minder resterende
verzoeken meldt, stopt de reeks. Deze reserve deelt het account met de
bestaande lokale wedstrijdimport en eventuele andere gebruikers van de
sleutel; de functie beheert niet het totale verbruik van externe tools.
De controle en initiële import deden samen zes HTTP-verzoeken. Na afloop
meldde de API 97 resterende dagverzoeken; geweigerde verzoeken leken niet
meegeteld te worden. We rekenen voor het eigen maximum wel elke poging mee.

Per bron blijven de laatst goede gegevens en hun ophaaltijd bestaan bij een
fout. De publieke `scc-upcoming`-functie leest alleen opgeslagen data en
combineert programma en voorbeschouwing. Een nieuwere lokale snapshot wint
van een oudere Blob. De browser kan alleen deze genormaliseerde gegevens
opvragen, geen API-sleutel of verversing starten. Een voorspelling vervalt
vanaf de aftrap en wordt nooit op een andere wedstrijd hergebruikt.

De hero toont vijf vormletters, ranglijstgegevens indien beschikbaar, de
bestaande aftelklok en de voorspelling met bron en tijdstempel. Vorm uit de
voorspellingsrespons bevat geen individuele uitslagen; daarom suggereren de
vakjes geen klikbare wedstrijddetails. Bekerwedstrijden krijgen geen
Eredivisie-positie. Bij ontbrekende data staat een korte melding of ontbreekt
de voorspelling. De onderliggende programmabron blijft de clubsite.

## Komende wedstrijden op de homepage

Het vertrekbord op `/` toont de eerstvolgende wedstrijd groot en maximaal
vier wedstrijden daaronder, zonder uitslag. De bron is het
[officiële Cambuur-programma](https://cambuur.nl/eerste-elftal/matchcenter/),
inclusief bekerwedstrijden. `src/lib/scc-upcoming.js` leest de programmarijen
met één HTTP-verzoek en bewaart datum, ploegen en competitie. Voor de
Eredivisie 2026/27 komt het rondenummer uit de lokale
`src/scc/rounds-2026-2027.json`. De bron geeft geen stadion per wedstrijd;
het bord toont daarom geen stadion of aanduiding `Uitwedstrijd`.

De build leest uitsluitend `src/scc/upcoming.json`. De browser vraagt
de publieke Netlify-functie `scc-upcoming` om de actuele lijst uit de
sitebrede Blob-opslag `scc-upcoming/schedule`; de meegepubliceerde JSON is
de beginstand en wint van een oudere Blob. De geplande functie
`scc-upcoming-refresh` controleert dagelijks om 03:00 UTC of de eerste
bewaarde speeldag in Amsterdam voorbij is. Alleen dan leest ze de clubsite
en bewaart de volgende vijf wedstrijden. Bij een lege lijst probeert ze
het na zeven dagen opnieuw. Als de clubsite niet bereikbaar is of de
HTML-structuur verandert, blijft de vorige opslag bestaan. Zonder komende
wedstrijd staat er `SC Cambuur`. De lokale momentopname kan met
`npm run scc:upcoming` worden ververst, met dezelfde grens voor een
nieuw verzoek. Het bord gebruikt geen API-Football-sleutel of quota.
Netlify activeert de planning vanuit `export const config` van de functie
na een productie-deploy; een GitHub Actions-workflow is hiervoor niet
nodig. De planning draait niet automatisch voor een Deploy Preview of
lokale Netlify Dev-sessie. Controleer na publicatie op de Functions-pagina
of `scc-upcoming-refresh` het label `Scheduled` en een volgende draaitijd
heeft.

De huidige lokale API-Football-sleutel heeft een gratis plan. Een controle
op 20 oktober 2026 gaf `Free plans do not have access to the Next parameter.`
Ook `season=2026` werd geweigerd (`try from 2022 to 2024`). Daarom gebruikt
het automatische bord het clubprogramma. De sleutel wordt gebruikt voor de bewuste wedstrijdimport en, sinds
21 oktober, de hierboven beschreven geplande voorbeschouwingsimport.

### Onderzoek Free-plan, 20 oktober 2026

De beperking betekent niet dat iedere toekomstige fixture verborgen is.
Met de lokale gratis sleutel gaf
`GET /fixtures/headtohead?h2h=420-195` dertien ontmoetingen terug,
waaronder **Willem II–Cambuur, 24 oktober 2026 om 18.45 uur**
(`fixture.id=1552200`, `status.short=NS`) en de return op
17 januari 2027. De eerste wedstrijd staat ook in het
[officiële Cambuur-programma](https://cambuur.nl/eerste-elftal/matchcenter/).
Dit is één verzoek als de tegenstander en diens API-team-ID al bekend
zijn. De head-to-head-respons komt niet op datum gesorteerd binnen.

De routes die de tegenstander zonder voorkennis zouden ontdekken zijn
gericht getest en geweigerd: `GET /fixtures?team=420` en
`GET /fixtures?team=420&from=2026-10-20&to=2026-11-10` met foutcategorie
`season`, en `GET /fixtures?team=420&date=2026-10-24` met foutcategorie
`plan`. `next=5` en `season=2026` waren in de eerdere proef al geweigerd.
Er is dus een bruikbare Free-route voor **een bekende tegenstander**, maar
geen aangetoonde Free-route om uitsluitend uit API-Football automatisch
de eerstvolgende Cambuurwedstrijd te vinden. Voor een automatisch
vertrekbord op Free is een tweede bron voor het programma of een vooraf
onderhouden lijst van tegenstanders nodig. Het officiële clubprogramma
bevat ook de bekerwedstrijd tegen VV Kloetinge op 27 oktober, die een
alleen op Eredivisie-tegenstanders gebaseerde lijst zou missen.

Verkenning op 19 oktober 2026. De voorlopige wedstrijdpagina's tonen
opgeslagen API-data, maar de definitieve weergave is nog niet bepaald.
De sleutel staat lokaal in `.env` als `API_FOOTBALL_KEY`; dat bestand wordt
door Git genegeerd. Er staat geen sleutel in de voorbeeldrespons of
documentatie.

## Voorbeeldwedstrijd

De volledige respons van `GET /fixtures?id=1552195` staat nu als
[ruwe momentopname](../../src/scc/api/1552195.json) in de gedeelde API-map.
Het [AZ-wedstrijdbestand](../../src/scc/2026-2027/2026-10-18-az.md)
is ermee gekoppeld en bevat inmiddels ook een eigen verslag.
Dit is een momentopname van de API, geen door ons gevalideerde statistiek.
De wedstrijd was Cambuur–AZ Alkmaar (2–2) op 18 oktober 2026 om 14:30 uur
lokale tijd in het **Kooi Stadion**, Leeuwarden. De API geeft Cambuur als
team 420, AZ als team 201 en het stadion als venue 12680. De officiële
[Cambuur-terugblik](https://cambuur.nl/nieuws/ijzersterk-sc-cambuur-krijgt-te-weinig-na-spektakelstuk/)
bevestigt uitslag en wedstrijd.

In deze respons zijn de volgende onderdelen gevuld:

| Onderdeel | Aanwezige gegevens | Gebruik bij een kort verslag |
| --- | --- | --- |
| `fixture`, `league`, `teams`, `goals`, `score` | Datum, scheidsrechter, stadion, competitie, speelronde, teams, eind- en ruststand | Kop en wedstrijdcontext |
| `events` | 21 gebeurtenissen met minuut, team, speler, type en soms aangever of toelichting | Doelpunten, kaarten, wissels en VAR in een tijdlijn |
| `lineups` | Beide formaties, 11 basisspelers en 12 reserves per ploeg; trainer | Opstellingen en tactische context |
| `statistics` | 16 teamwaarden per ploeg, waaronder xG, schoten, balbezit, passes, corners en overtredingen | Enkele kerncijfers naast het verslag |
| `players` | 23 spelers per ploeg, met onder meer minuten, positie, beoordeling, schoten, passes, duels en kaarten | Individuele cijfers waar die iets toevoegen |

Voor deze wedstrijd staan in de API onder meer 11–7 schoten, 36–64%
balbezit en 1,53–1,56 xG (Cambuur–AZ). De vier doelpunten zijn als
`Goal`-events aanwezig. De API registreert ook een rode kaart voor
Cambuur in minuut 53 en de 2–2 als strafschop in minuut 83. Deze cijfers
en gebeurtenissen zijn geschikt als aanknopingspunt; duiding en eigen
wedstrijdverslag blijven redactioneel.

## Gecontroleerd importeren

Op 20 oktober 2026 zijn de 31 verslagen van 2025/26 en de negen van
2026/27 gekoppeld aan volledige, lokaal opgeslagen API-responsen.
De wedstrijden worden in dev en build uitsluitend uit die JSON gelezen.

Maak voor een afgelopen wedstrijd eerst een `.md` in de juiste
seizoensmap, bijvoorbeeld `src/scc/2026-2027/`. Vul `date`, `home`,
`away` en `score.home`/`score.away` in de front matter in. Gebruik de
werkelijke speeldatum en de score in thuis–uit-volgorde; laat
`matchdata` weg en zet je verslag in de body. Voer daarna vanuit de
projectroot in een interactieve terminal uit:

```sh
npm run scc:matchdata
```

De taak toont alle verslagen zonder matchdata. Als die over meerdere
seizoenen verdeeld zijn, kies je eerst een seizoen. Daarna zie je de
wedstrijden en het **maximale aantal API-verzoeken**. Pas na je antwoord
`j` zoekt de taak de fixture-ID's, vergelijkt datum, ploegen en uitslag
met de Markdown en haalt de volledige wedstrijdresponsen op. Met Enter
of `n` stopt hij zonder API-verzoek. Als er niets ontbreekt, stopt hij
eveneens zonder verzoek.

Alleen verslagen zonder numeriek `matchdata`-ID komen in de selectie.
Een ontbrekend veld, `matchdata: pending` of `matchdata: null` telt als
ontbrekend. Een verslag met `matchdata: <id>` wordt bij de eerste scan,
de fixturezoektocht en de detailimport overgeslagen, ook als het in een
oude zoekrespons voorkomt. De taak haalt daarvoor geen nieuwe data op
en wijzigt dat verslag of de bestaande JSON niet.

Per tegenstander is hoogstens één head-to-head-verzoek nodig, plus
eventueel één verzoek voor de Nederlandse teamlijst. Daarna gebruikt
de taak één `id`-verzoek per wedstrijd. Tussen verzoeken zit minstens
6,5 seconden. De zoekresponsen staan alleen in een tijdelijke map van
het besturingssysteem. Elke volledige wedstrijdrespons wordt blijvend
opgeslagen als `src/scc/api/<id>.json`; het script voegt alleen
`matchdata: <id>` toe aan het passende verslag. Een bestaande JSON of
al gekoppeld verslag wordt niet opnieuw opgehaald of overschreven.
Bij een afwijking stopt de taak voor de detailimport zodat je eerst de
front matter kunt controleren. Een onderbroken import kan opnieuw
worden gestart; al gekoppelde wedstrijden worden overgeslagen.

Daarna lezen `npm run dev` en een gewone build de opgeslagen JSON.
Commit het nieuwe Markdown-bestand en `api/<id>.json` zelf mee wanneer
je de wijziging wilt publiceren. De importtaak doet dat niet automatisch.

Ook één tot vijf ontbrekende wedstrijden kunnen in één keer met dit
commando worden verwerkt. Voor handmatig herstel met een bekend ID
blijven `fetch` en `link` beschikbaar als subcommando's van dezelfde
npm-taak. De zoek- en importlogica staat in een interne module; er is
geen tweede npm-taak nodig.

De volledige JSON is de enige bron voor API-gegevens. Een gekoppeld
Markdown-bestand heeft bijvoorbeeld `matchdata: 1552195`; Eleventy leest
bij de build `src/scc/api/1552195.json` en geeft `response[0]` als `match` door
aan de collectie. Nunjucks kan daardoor `match.events`, `match.lineups`,
`match.statistics` en `match.players` direct gebruiken. Zonder ID is
`match` `null`. Ook handmatig een ID invullen werkt wanneer het juiste
JSON-bestand al aanwezig is; `link` controleert de koppeling vooraf.
De API-sleutel wordt alleen voor import uit de lokale `.env` gelezen en
staat niet in de opgeslagen data. Builds vragen de API nooit zelf op.
Voor elke wedstrijd genereert Eleventy ook een `data.json` in de
voorlopige [wedstrijdweergave](../architectuur/wedstrijden.md). Zonder gekoppelde API-respons staat in `data.json` `match: null`.

## Ranglijstverplaatsing

De opgeslagen fixture-respons bevat alleen `league.standings` als
indicatie dat de competitie een ranglijst heeft; een plaats vóór of na
de wedstrijd ontbreekt. [API-Football beschrijft `/standings`](https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide)
als de actuele stand voor een competitie en seizoen. De beschreven
parameters leveren geen historische stand op een wedstrijddatum of na
een speelronde. Voor een betrouwbare stijging of daling zouden we
historische snapshots of alle uitslagen van de competitie met de
ranglijstregels nodig hebben. Op 21 oktober 2026 is `/standings` voor 2026 gecontroleerd en door Free
geweigerd. Het wedstrijdarchief toont de punten van de afzonderlijke
wedstrijd; de voorbeschouwing toont geen verzonnen ranglijstpositie.

Bij de proef op 20 oktober 2026 weigerde het Free-plan de parameters
`season=2026`, historische `date`, `last` en `ids` op `/fixtures`.
De parameter `id` voor één wedstrijd en het endpoint
`/fixtures/headtohead?h2h=<cambuur-id>-<tegenstander-id>` werkten wel,
ook voor de wedstrijden van 2025/26. De taak kent ook `discover` en
een meervoudige `ids`-import voor andere abonnementen, maar die routes
zijn niet geschikt voor dit Free-plan. Het script stopt vóór nieuwe
verzoeken als de gemelde resterende dagquota onder vijf komt.

## Thuiswedstrijden selecteren

De collectie bevat ook uitwedstrijden. Voor wedstrijden in het Kooi
Stadion moet later op thuisploeg én stadion worden gefilterd:
`teams.home.id === 420` en `fixture.venue.id === 12680`. Een
thuiswedstrijd hoeft niet per definitie in het Kooi Stadion plaats te
vinden. De ruwe respons bevat ook opstellingen en spelerstatistieken.

De [API-Football-prijspagina](https://www.api-football.com/pricing)
vermeldt voor Free 100 requests per dag en beperkte seizoentoegang.
Volgens de [API-documentatie](https://api-sports.io/documentation/football/v3)
kan de feitelijke dekking per competitie, seizoen en wedstrijd verschillen;
lege of `null`-velden zijn dus mogelijk. De
[uitleg over quota en batchverzoeken](https://www.api-football.com/news/post/how-to-optimize-api-sports-calls-and-quota-usage)
beschrijft maximaal 20 wedstrijd-ID's per detailverzoek. Voor dit
oorspronkelijke AZ-voorbeeld zijn twee API-verzoeken gedaan: één
datumzoekopdracht en één detailverzoek. De Free-planroute hierboven
is daarna met de bestaande veertig verslagen uitgevoerd.


Technische referenties voor de geplande import:
[Netlify Functions-context](https://docs.netlify.com/build/functions/api/),
[uitvoeringslimieten](https://docs.netlify.com/build/functions/configuration/),
[omgevingsvariabelen](https://docs.netlify.com/build/functions/environment-variables/)
en [conditionele Blob-writes](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
