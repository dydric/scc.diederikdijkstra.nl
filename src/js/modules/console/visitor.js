// Bestand: js/modules/console/visitor.js
//
// Wat de bezoeker doet, gemeten in de browser, voor de console
// (modules/console/run.js en de states). Alleen wat echt gebeurt; elke
// waarde staat ook in console.log. De regels zelf: lines.js.
//
//   track()     één keer per pagina (run.js, alleen in de dock): telt de
//               pagina, luistert naar klikken, hover en scrollen, en
//               bewaart bij het weggaan (pageswap, pagehide) wat er op deze
//               pagina gebeurde in sessionStorage (VISIT)
//   previous()  de vorige pagina van deze sessie: { path, ms, seen, click }
//               (ms: zo lang stond hij open; seen: tot hoever, 0–100, de
//               onderkant van het venster op z'n laagst; click: de laatste
//               klik, { tag, label }, of null); null op de eerste pagina
//   session()   { n, ms }: de hoeveelste pagina van deze sessie, en hoe
//               lang die al loopt
//   hovered()   de laatste link of knop onder de muis op deze pagina
//               ({ tag, label }), of null (ook op een touchscreen)
//
// Een label is de tekst van het element zoals hij op de pagina staat (of
// aria-label, title, en bij een link zonder tekst het pad), in kapitalen
// en alleen met tekens die in JetBrains Mono staan; kort afgebroken op een
// woord.

const VISIT = 'dock-visit';
const PAGES = 'dock-pages';
// Een label hooguit zoveel tekens.
const LABEL = 24;
// Waar een klik of hover bij hoort: het element zelf als het iets doet.
const ACTIVE = 'a[href], button, [role="button"], summary, label, input, select, textarea';

const read = (key) => {
	try {
		return JSON.parse(sessionStorage.getItem(key));
	} catch {
		return null;
	}
};
const store = (key, value) => {
	try {
		sessionStorage.setItem(key, JSON.stringify(value));
	} catch {}
};

// Tekst die het bord kan zetten: zonder accenten, in kapitalen, alleen
// tekens uit het font; afgebroken op een woord.
const clean = (text) => {
	const words = (text ?? '')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toUpperCase()
		.replace(/[^A-Z0-9 .,:!?&/+#()_-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (words.length <= LABEL) return words;
	const cut = words.slice(0, LABEL + 1);
	return (cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')) : cut.slice(0, LABEL)).trim();
};

// { tag, label } van wat er geraakt is: een actief element met z'n tekst,
// anders alleen de tag (een klik op een alinea zegt niets over de tekst).
const what = (target) => {
	if (!(target instanceof Element)) return null;
	const el = target.closest(ACTIVE);
	if (!el) return { tag: target.tagName, label: '' };
	const path = el.matches('a[href]') ? decodeURI(new URL(el.href, location.href).pathname) : '';
	const label = clean(el.getAttribute('aria-label') || el.textContent || el.getAttribute('title')) || clean(path);
	return { tag: el.tagName, label };
};

let prev = null;
let pages = null;
let click = null;
let hover = null;
let seen = 0;
let tracking = false;

const measure = () => {
	const height = document.documentElement.scrollHeight;
	if (height) seen = Math.max(seen, Math.min(1, (scrollY + innerHeight) / height));
};

export function track() {
	if (tracking) return;
	tracking = true;
	prev = read(VISIT);
	const was = read(PAGES);
	pages = { n: (was?.n ?? 0) + 1, since: was?.since ?? Date.now() };
	store(PAGES, pages);
	if (prev) console.log('visit', prev);
	console.log('session', session());

	addEventListener('click', (event) => (click = what(event.target)), { capture: true, passive: true });
	addEventListener(
		'pointerover',
		(event) => {
			if (event.pointerType !== 'mouse') return;
			const el = event.target instanceof Element && event.target.closest(ACTIVE);
			if (el) hover = what(el);
		},
		{ passive: true },
	);
	addEventListener('scroll', measure, { passive: true });

	// Bij het weggaan: pageswap komt eerder (vóór de view transition),
	// pagehide altijd. Zo lang stond de pagina open (vanaf de navigatie).
	const save = () => {
		measure();
		const visit = { path: decodeURI(location.pathname), ms: Math.round(performance.now()), seen: Math.round(seen * 100), click };
		store(VISIT, visit);
	};
	addEventListener('pageswap', save);
	addEventListener('pagehide', save);
}

// Lees de waarde van deze pagina, of uit sessionStorage als track() nog
// niet is begonnen. VISIT wordt pas bij het weggaan overschreven.
export const previous = () => (tracking ? prev : read(VISIT));
export const session = () => {
	const now = pages ?? read(PAGES);
	return now ? { n: now.n, ms: Date.now() - now.since } : null;
};

// Elke nieuwe hover één keer in console.log, als de console hem toont.
let logged = null;
export const hovered = () => {
	if (hover && hover !== logged) console.log('hover', (logged = hover));
	return hover;
};
