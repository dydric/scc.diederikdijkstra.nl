// Bestand: js/modules/console/boot.js
//
// Het opstartlog: wat de browser echt meet over deze pagina, geschreven
// als JavaScript met de waarde erin: CONST T = AWAIT LOAD(); // 412MS. Een
// regel in vormen van lang naar kort; het bord kiest de langste die past,
// de kortste past in 15. Elke meting komt één keer in de console
// (console.log, als object), ook als er meer borden om vragen. Gebruikt
// door het tickerbord (modules/console/run.js, modus console).
//
//   goto()     de wissel naar deze pagina, op een volgende pagina (vormen)
//   load()     de eerste pagina van een sessie, in één regel: tot het
//              load-event, en wat de pagina zelf laadde (fonts, CSS, JS:
//              hoeveel per soort en samen de grootte over de lijn, of
//              CACHE); pas als alles binnen is, ook de fonts (vormen)
// Wat de bezoeker doet (klik, hover, de vorige pagina): console/visitor.js.

// Eén keer meten, hoe vaak er ook om gevraagd wordt.
const once = (fn) => {
	let result;
	return () => (result ??= fn());
};

const loaded = () =>
	document.readyState === 'complete' ? Promise.resolve() : new Promise((resolve) => addEventListener('load', resolve, { once: true }));

// Wat de pagina zelf laadde, per soort (naar de extensie): hoeveel, en
// samen de grootte. Pas als alles binnen is (het load-event, en de fonts,
// die ook na load nog kunnen komen). Niets geladen: null.
const KINDS = { FONTS: /\.(woff2?|otf|ttf)$/, CSS: /\.css$/, JS: /\.m?js$/ };
const files = async () => {
	await Promise.all([loaded(), document.fonts.ready]);
	const entries = performance
		.getEntriesByType('resource')
		.filter((entry) => new URL(entry.name).origin === location.origin);
	const kinds = Object.entries(KINDS)
		.map(([kind, test]) => ({ kind, n: entries.filter((entry) => test.test(new URL(entry.name).pathname)) }))
		.filter(({ n }) => n.length);
	const list = kinds.flatMap((k) => k.n);
	if (!list.length) return null;
	const bytes = list.reduce((sum, entry) => sum + entry.transferSize, 0);
	const size = bytes ? `${Math.max(1, Math.round(bytes / 1024))}KB` : 'CACHE';
	return { kinds: kinds.map(({ kind, n }) => [kind, n.length]), n: list.length, size };
};

// Eén regel voor het hele opstartlog: de laadtijd (tot het load-event) en
// wat er geladen is. Eerder waren dat drie regels (LOAD, VIEW, FILES); één
// regel scheelt twee keer typen en stilstaan vóór de pagina mag komen.
export const load = once(async () => {
	const got = await files();
	const nav = performance.getEntriesByType('navigation')[0];
	const ms = Math.round(nav?.loadEventStart || performance.now());
	console.log('load', { ms, ...(got && { ...Object.fromEntries(got.kinds), size: got.size }) });
	const short = [`LOAD(); // ${ms}MS`, `LOAD ${ms}MS`];
	if (!got) return [`CONST T = AWAIT LOAD(); // ${ms}MS`, `AWAIT LOAD(); // ${ms}MS`, ...short];
	const { kinds, n, size } = got;
	const each = kinds.map(([kind, count]) => `${kind} ${count}`).join(' ');
	return [
		`CONST T = AWAIT LOAD(); // ${ms}MS · ${each} · ${size}`,
		`AWAIT LOAD(); // ${ms}MS · ${n} FILES ${size}`,
		`LOAD(); // ${ms}MS · ${n} FILES ${size}`,
		`LOAD(); // ${ms}MS · ${n} FILES`,
		`LOAD ${ms}MS ${size}`,
		`LOAD ${ms}MS`,
	];
});

// De wissel naar deze pagina: waarheen, hoe (GOTO, BACK of RELOAD) en
// hoe lang tot de HTML binnen was.
export const goto = once(async () => {
	const nav = performance.getEntriesByType('navigation')[0];
	const path = decodeURI(location.pathname);
	const ms = Math.round(nav?.responseEnd || performance.now());
	const how = { reload: 'RELOAD', back_forward: 'BACK' }[nav?.type] ?? 'GOTO';
	console.log('goto', { path, type: nav?.type, ms });
	return [`${how}("${path}"); // ${ms}MS`, `${how}("${path}");`, `${how} ${path}`];
});
