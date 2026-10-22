// Bestand: js/modules/console/run.js
//
// De console (het tickerbord in modus console, gestart door
// components/ticker.js): de vaste volgorde, elke pagina gelijk, en dan
// de state van de pagina (states/). De hele werking: docs/componenten/dock.md.
//
//   1. intro      de eerste keer per sessie, in de dock: ontstaan als een
//                 terminal (data-dock-boot op :root)
//   2. load/goto  de eerste pagina van een sessie (first): het hele
//                 opstartlog in één regel, de laadtijd en wat de pagina
//                 laadde (fonts, CSS en JS; pas als alles binnen is). Die
//                 typt uit en staat kort links (brief); de pagina blijft
//                 leeg tot hij heeft gestaan. Een volgende pagina: de
//                 wissel (GOTO("/pad/"); // 84MS), zonder te wachten; wat
//                 de bezoeker op de vorige pagina deed, zegt de state
//                 (visitor.js)
//   3. lead      de melding van de 404, als die er is
//   4. state     de klok of de 404-wachtstand
//
// ready() haalt data-dock-pending weg zodra de pagina mag verschijnen.
// Bij een fout geeft het vangnet de pagina alsnog vrij.

import { goto, load } from './boot.js';
import { DEFAULT, STATES } from './states/index.js';
import { track } from './visitor.js';

const root = document.documentElement;

export async function runConsole(ticker, { first }) {
	const places = ticker.el.dataset.tickerPlaces?.split('|') ?? [];
	const name = ticker.el.dataset.tickerState || DEFAULT;
	const state = STATES[name] ?? STATES[DEFAULT];
	if (!STATES[name]) console.warn('console', `onbekende state "${name}", ${DEFAULT} in plaats daarvan`);
	const dock = !!ticker.el.closest('.dock');
	const ready = () => dock && root.removeAttribute('data-dock-pending');
	const ctx = { places, ready, first, dock };
	// Wat de bezoeker doet, vanaf nu (en de vorige pagina terug).
	if (dock) track();

	state.prepare?.(ctx);
	// De console draait: het vangnet in partials/dock.njk laat hem dan.
	if (dock) root.setAttribute('data-dock-live', '');
	try {
		if (root.hasAttribute('data-dock-boot') && dock) {
			await ticker.intro();
			root.removeAttribute('data-dock-boot');
		}

		if (!first) ticker.write(await goto());
		// Het opstartlog: één regel, en wachten tot hij kort heeft gestaan.
		else await ticker.write(await load(), { brief: true });
		await state.lead?.(ticker, ctx);
		await state.run(ticker, ctx);
	} catch (error) {
		console.error('console', error);
		root.removeAttribute('data-dock-boot');
		ready();
	}
}
