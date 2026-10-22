// Bestand: js/modules/site/grid.js
//
// Het raster (base/grid.css): kolommen van COL vanuit het midden van de
// pagina, naar buiten doorlopend tot de rand van het scherm, blokjes van
// FINE en een rijlijn om de ROW. Vanuit het midden, zodat iets dat in het
// midden staat en een heel aantal kolommen breed is (een blok van 4
// kolommen) altijd op de lijnen valt, ook als de pagina een oneven aantal
// kolommen breed is (288, 352, 416) of op een telefoon alleen elke tweede
// lijn staat. Is de pagina een veelvoud van 64 breed, dan valt dat samen
// met de rand. De paginaranden en de liniaal onder de balk in het
// accent (--grid-accent, theme/colors.css).
//
// Getekend als één tegel op device-pixels (canvas van breedte × ROW), als
// achtergrond van <body>: elke lijn valt op een hele device-pixel en is er
// precies één breed, ook bij zoom. Een lijn op x ligt op de pixel rechts van
// x; de linker paginarand daarom één pixel naar links, zodat beide randen
// búiten de pagina liggen en aan beide kanten even zichtbaar zijn naast een
// beeld.
//
// De kolom komt van de CSS (.grid-probe: --page-inset en --container-page),
// zodat raster en pagina dezelfde pixel delen. Opnieuw bij een andere
// breedte, zoom (devicePixelRatio) of thema. De tegels staan in een eigen
// stylesheet, niet op <html>.

const COL = 32;
const ROW = 32;
const FINE = 8;
const PHONE = 320; // tot en met deze paginabreedte: elke tweede kolomlijn
const RULER = 8; // hoogte van de liniaal

// De twee paginaranden als lange lijn in het accent. false: ze zijn gewone
// kolomlijnen. De liniaal gebruikt overal dezelfde kolomstreepjes.
// Zo ook zolang :root data-grid-edgeless heeft: een pagina zet dat met
// edges: false in de front matter (layouts/base.njk, nu home), en
// setEdges() zet ze weer (of haalt ze weg); het raster tekent dan opnieuw.
const EDGE_LINES = true;
const root = document.documentElement;
const edges = () => EDGE_LINES && !root.hasAttribute('data-grid-edgeless');

export const setEdges = (on) => root.toggleAttribute('data-grid-edgeless', !on);

// Alpha per soort lijn, op de tekstkleur (--fg) of het accent.
const ALPHA = { fine: 0.045, row: 0.075, inside: 0.075, outside: 0.05, edge: 0.7 };
const TICK = { minor: [4, 0.5], major: [8, 0.8] };

const sheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

// Een kleur uit een token, zoals de browser hem rekent (ook oklch).
function color(probe, token) {
	probe.style.color = `var(${token})`;
	return getComputedStyle(probe).color;
}

function tile(width, height, dpr, paint) {
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(width * dpr);
	canvas.height = Math.round(height * dpr);
	const g = canvas.getContext('2d');
	paint(g, (v) => Math.round(v * dpr), canvas);
	return { url: canvas.toDataURL(), size: `${canvas.width / dpr}px ${canvas.height / dpr}px` };
}

function draw(probe) {
	const dpr = window.devicePixelRatio || 1;
	const width = document.body.clientWidth;
	const box = probe.getBoundingClientRect();
	const left = Math.round(box.left);
	const page = Math.round(box.width);
	const step = page <= PHONE ? COL * 2 : COL;
	// Het midden van de pagina: daar staat altijd een kolomlijn. De pagina
	// is een veelvoud van 32, dus het midden valt op het raster van FINE.
	const mid = left + page / 2;
	const fg = color(probe, '--fg');
	const accent = color(probe, '--grid-accent');
	// De eerste lijn links van het scherm, op het raster vanuit het midden.
	const start = (unit) => mid - Math.ceil(mid / unit) * unit;

	// Een verticale lijn: op de pixel rechts van x, de linker paginarand
	// één pixel naar links.
	const columns = (X, line) => {
		for (let x = start(FINE); x <= width; x += FINE) line(X(x), ALPHA.fine, fg);
		for (let x = start(step); x <= width; x += step) {
			if (x === left || x === left + page) continue;
			line(X(x), x > left && x < left + page ? ALPHA.inside : ALPHA.outside, fg);
		}
		// De paginaranden los: ze vallen niet altijd op de stap (288, 352
		// en 416: een halve kolom ernaast).
		for (const x of [left, left + page]) {
			if (edges()) line(X(x) - (x === left ? 1 : 0), ALPHA.edge, accent);
			else line(X(x), ALPHA.outside, fg);
		}
	};

	const grid = tile(width, ROW, dpr, (g, X, c) => {
		const line = (x, a, col) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(x, 0, 1, c.height); };
		columns(X, line);
		g.fillStyle = fg;
		g.globalAlpha = ALPHA.fine;
		for (let y = FINE; y < ROW; y += FINE) g.fillRect(0, X(y), c.width, 1);
		g.globalAlpha = ALPHA.row;
		g.fillRect(0, 0, c.width, 1);
	});

	const ruler = tile(width, RULER, dpr, (g, X, c) => {
		g.fillStyle = accent;
		g.globalAlpha = 0.5;
		g.fillRect(0, 0, c.width, 1);
		const tick = (x, [h, a]) => {
			g.globalAlpha = a;
			g.fillRect(X(x), 0, 1, X(h));
		};
		for (let x = start(COL); x <= width; x += COL) {
			tick(x, (x - mid) % 64 === 0 ? TICK.major : TICK.minor);
		}
	});

	sheet.replaceSync(`
		body { background-image: url(${grid.url}); background-size: ${grid.size}; background-position: 0 0; }
		.grid-ruler { --grid-ruler: url(${ruler.url}); --grid-ruler-size: ${ruler.size}; }
	`);
}

export function initGrid() {
	const probe = document.querySelector('.grid-probe');
	if (!probe) return;

	let frame = 0;
	const redraw = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => draw(probe));
	};

	new ResizeObserver(redraw).observe(document.body);
	new MutationObserver(redraw).observe(root, { attributeFilter: ['data-grid-edgeless'] });
	matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
	(function watchZoom() {
		matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => {
			redraw();
			watchZoom();
		}, { once: true });
	})();
	draw(probe);
}
