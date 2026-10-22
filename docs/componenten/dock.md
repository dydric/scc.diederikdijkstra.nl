# De dock en de console

De dock is het tickerbord onderaan iedere SCC-pagina. De vormgeving en het tempo staan in `src/css/components/dock.css`, `ticker.css` en `src/js/modules/effects/ticker.js`. Het overzicht kiest `await`, de wedstrijdpagina's de standaardstate `live` en de 404 kiest `error`.

De bordcellen gebruiken JetBrains Mono via de gedeelde `font-pixel`-utility. De celmaten en het animatietempo zijn behouden.

## Verloop

`src/includes/partials/dock.njk` zet vóór de eerste paint `data-dock-pending` op de root. Bij de eerste pagina van een sessie komt ook `data-dock-boot`: de cursor en de rij ontstaan dan via `intro()` van het tickerbord. Bij een volgende navigatie herstelt de dock de vorige rij uit `sessionStorage`, mits die minder dan tien seconden oud is. `src/js/components/ticker.js` bewaart die rij bij `pageswap` en `pagehide`.

Daarna voert `src/js/modules/console/run.js` een vaste volgorde uit:

1. Eerste pagina: één opstartregel met de gemeten laadtijd, aantallen fonts, CSS- en JS-bestanden en overdrachtsgrootte. De pagina wacht tot die regel kort heeft gestaan.
2. Volgende pagina: `GOTO`, `BACK` of `RELOAD` met het pad en de gemeten tijd. Die regel blokkeert de pagina niet.
3. De state kan een melding geven via `lead()` en voert daarna `run()` uit. `ready()` haalt `data-dock-pending` weg.

Als de module niet binnen drie seconden start, haalt het inline vangnet in `dock.njk` de wachtstand weg. Bij een fout tijdens de console doet `run.js` dat zelf. Met `prefers-reduced-motion` draait de console niet; de plaatsnaam uit de HTML blijft zichtbaar.

## States

| State | Pagina | Regels |
| --- | --- | --- |
| `live` | Standaard, wedstrijden | Na een paginawissel de laatste klik en de vorige pagina, daarna de lokale tijd, UTC-offset en afwisselend `Leeuwarden/NL` en `Liwwadden/058`. De klok wordt iedere seconde bijgewerkt. Onder 300px toont de dock blijvende rode breedtemeldingen. |
| `await` | Overzicht (`/`) | Na LOAD of GOTO `SYSTEMS READY · AWAITING INPUT`, daarna afwisselend die melding, de klok, tijd zonder invoer, hover, sessieduur en `STDIN OPEN · LISTENING`. Onder 300px komen de rode breedtemeldingen. Een verborgen tab toont `Awaiting input` in de titel. |
| `error` | 404 | Een rode `× 404 · PAGE NOT FOUND` met het pad als dat past, daarna afwisselend de fout en `READY`. Onder 300px komen de breedtemeldingen. |

Een pagina kiest een state met `console: await` of `console: error` in front matter. Zonder waarde is de state `live`; een onbekende waarde valt met een waarschuwing in de browserconsole terug op `live`.

De klok gebruikt `site.location.name` en `nameFy` uit `src/data/site.js` en de tijdzone `Europe/Amsterdam` uit `src/js/modules/data/time.js`. De dock haalt geen weer of API-Football-data op. De wedstrijdinhoud komt uit de pagina en de SCC-collectie.

## Een regel toevoegen

`src/js/modules/console/states/index.js` registreert de states. Een state kan `prepare(ctx)`, `lead(ticker, ctx)` en `run(ticker, ctx)` hebben. `ctx.ready()` moet worden aangeroepen zodra de pagina mag verschijnen. Alle tekst op het bord is Engels en in kapitalen. Een regel heeft vormen van lang naar kort; de kortste moet in vijftien cellen passen. Waarden komen uit een meting of de pagina, en worden niet verzonnen.

Het bord biedt `write(vormen, opties)`, `end(vormen)`, `idle(teksten)`, `set(tekst)`, `patch(vormen)`, `width()` en `room()`. `write` kan `brief`, `pass`, `warn`, `enter` en `at` krijgen. Het tempo in `CONSOLE` in `effects/ticker.js` blijft gelijk aan dat van de oorspronkelijke site. De vorige pagina, sessie, klik en scrollvoortgang worden in `src/js/modules/console/visitor.js` gemeten en bewaard.

De dock heeft een lege `.dock-space` na de pagina. Die reserveert de tickerhoogte, de veilige schermrand, de onderruimte en `--page-end-gap` boven de dock, zodat de laatste inhoud niet achter het bord verdwijnt. De SCC-werkruimte krijgt daar 48px bovenruimte; gewone inhoudspagina's 32px.
