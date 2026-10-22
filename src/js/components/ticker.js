// Bestand: js/components/ticker.js
//
// Start de tickerborden ([data-ticker], partials/ticker.njk); de logica staat
// in modules/effects/ticker.js. data-ticker is de modus (random, console),
// data-ticker-set de tekens (bits, hex, alnum, code). Een bord loopt alleen in
// beeld en met het tabblad zichtbaar; met prefers-reduced-motion staat het
// stil, met de tekst uit de HTML.
//
// console: wat erop komt, regelt modules/console/run.js (docs/componenten/dock.md).
// Hier alleen of dit de eerste pagina van de sessie is (BOOTED), en de rij
// bewaren bij het weggaan (pageswap, pagehide; ROW): partials/dock.njk zet
// hem op de volgende pagina terug vóór de eerste paint (data-dock-restored
// op :root), zodat de band doorloopt.

import { createTicker } from '../modules/effects/ticker.js';
import { runConsole } from '../modules/console/run.js';

// De rij bij het weggaan (partials/dock.njk leest hem terug), en of de
// console in deze sessie al is opgebouwd.
const ROW = 'dock-row';
const BOOTED = 'dock-boot';

const boards = document.querySelectorAll('[data-ticker]:not([data-ticker="demo"])');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// De eerste pagina van deze sessie? Eén keer bepaald, voor alle borden.
let first = true;

if (boards.length && !still) {
	try {
		first = !sessionStorage.getItem(BOOTED);
		sessionStorage.setItem(BOOTED, '1');
	} catch {}
	const inView = new Set();
	const tickers = new Map();
	const sync = (ticker) => (inView.has(ticker.el) && !document.hidden ? ticker.resume() : ticker.pause());

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(({ target, isIntersecting }) => {
			if (isIntersecting) inView.add(target);
			else inView.delete(target);
			sync(tickers.get(target));
		});
	});

	boards.forEach((el) => {
		const mode = el.dataset.ticker || 'random';
		const dock = el.closest('.dock');
		const keep = !!dock && root.hasAttribute('data-dock-restored');
		const ticker = createTicker(el, { mode, set: el.dataset.tickerSet, keep });
		if (mode === 'console') runConsole(ticker, { first });
		// De rij bewaren voor de volgende pagina: pageswap komt eerder
		// (vóór de view transition), pagehide altijd.
		if (dock) {
			const save = () => {
				try {
					sessionStorage.setItem(ROW, JSON.stringify({ at: Date.now(), cells: ticker.snapshot() }));
				} catch {}
			};
			addEventListener('pageswap', save);
			addEventListener('pagehide', save);
		}
		tickers.set(el, ticker);
		observer.observe(el);
	});

	document.addEventListener('visibilitychange', () => tickers.forEach(sync));
}
