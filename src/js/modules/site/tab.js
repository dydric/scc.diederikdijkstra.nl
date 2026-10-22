// Bestand: js/modules/site/tab.js
//
// De titel in de tab: altijd de naam (NAME, de <title> in
// layouts/base.njk), met soms een melding ervoor, zoals op het bord:
//
//   × 404 · SC Cambuur
//
// Weinig: een fout, en een enkele regel van de console. Twee lagen:
//
//   setTab(tekst)        blijft staan tot setTab(null) (de 404).
//   sayTab(tekst, ms)    even, gaat voor de vaste; daarna terug.
//
// Zelf vangt hij een fout in de eigen JS (window error): kort
// `× Error`. Elke bundel deelt deze module (esbuild splitting), dus er is
// één stand.

const NAME = 'SC Cambuur';
const SAY = 4000;

let fixed = null;
let temp = null;
let timer = 0;

const render = () => {
	const text = temp ?? fixed;
	document.title = text ? `${text} · ${NAME}` : NAME;
};

export function setTab(text) {
	fixed = text || null;
	render();
}

export function sayTab(text, ms = SAY) {
	clearTimeout(timer);
	temp = text;
	render();
	timer = setTimeout(() => {
		temp = null;
		render();
	}, ms);
}

// Een fout in de eigen scripts (niet van een extensie of een ander
// domein); één keer per pagina is genoeg.
export function initTab() {
	render();
	const onError = (event) => {
		if (!event.filename?.startsWith(location.origin)) return;
		removeEventListener('error', onError);
		sayTab('× Error', 6000);
	};
	addEventListener('error', onError);
}
