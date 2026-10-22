# Projectinstructies

Lees [docs/README.md](docs/README.md) en [docs/architectuur/project.md](docs/architectuur/project.md) voor het relevante onderwerp en de codekaart. Werk op `main`. De gebruiker commit, pusht en deployt zelf, tenzij hij dat expliciet vraagt. Start geen dev-server of watcher; gebruik `npm run check:build` voor een tijdelijke controlebuild. Behoud bestaand werk in de werkboom.

Stack: Eleventy 3, Nunjucks, Tailwind CSS 4, esbuild en Netlify. Commentaar en documentatie in het Nederlands. Houd na wijzigingen het relevante onderwerpdocument en [docs/workflow/overdracht.md](docs/workflow/overdracht.md) bij.

De CSS- en JS-basis, het 32px-raster, de 8px-maatstappen en de mono-typografie komen uit de oorspronkelijke site. Gebruik voor pagina-assets `{% asset %}` of `{% assetUrl %}`; link niet direct naar `/css/` of `/js/`. Wijzig bestaand animatietempo alleen na afstemming.

API-Football wordt alleen voor de import door `npm run scc:matchdata` benaderd. Het komende programma komt van de officiële Cambuur-site; de geplande Netlify-functie ververst het pas na de eerstvolgende speeldag. Builds lezen uitsluitend de opgeslagen JSON. Voeg nooit een sleutel of lokale `.env` toe aan Git. Import controleert datum, ploegen en uitslag voordat een respons gekoppeld wordt.
