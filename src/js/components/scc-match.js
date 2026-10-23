// De wedstrijdpagina: het verloop en de eindstand blijven statisch.
// Kaarten, balken en rapportcijfers verschijnen als ze in beeld komen.
import { reveal, still } from '../modules/scc/effects.js';
import { turf } from '../modules/scc/turf.js';

reveal();

// Het voetbalveld onder het bord (css/components/scc-turf.css).
turf(document.querySelectorAll('[data-turf]'));

// Twee vaste rijen. Schuif botsende symbolen binnen hun eigen rij en
// teken de verbinding vanaf de echte minuut; bij verschuiving loopt die
// verbinding schuin. Op maatwijziging opnieuw verdelen.
const plot = document.querySelector('[data-strip-plot]');
if (plot) {
	const tracks = [...plot.querySelectorAll('[data-strip-track]')];
	const wires = plot.querySelector('.scc-strip-connectors');
	let scheduled = false;
	const layout = () => {
		scheduled = false;
		const box = plot.getBoundingClientRect();
		const width = box.width;
		wires.setAttribute('viewBox', `0 0 ${width} ${box.height}`);
		wires.replaceChildren();
		for (const track of tracks) {
			const pins = [...track.querySelectorAll('.scc-strip-pin')];
			const sizes = pins.map(pin => pin.querySelector('button').offsetWidth);
			const gap = Math.max(0, Math.min(4, (width - sizes.reduce((sum, size) => sum + size, 0)) / Math.max(1, pins.length - 1)));
			const places = pins.map((pin, i) => Math.max(0, Math.min(width - sizes[i], Number(pin.dataset.t) * width - sizes[i] / 2)));
			for (let i = 1; i < places.length; i++) places[i] = Math.max(places[i], places[i - 1] + sizes[i - 1] + gap);
			if (places.length && places.at(-1) + sizes.at(-1) > width) {
				places[places.length - 1] = width - sizes.at(-1);
				for (let i = places.length - 2; i >= 0; i--) places[i] = Math.min(places[i], places[i + 1] - sizes[i] - gap);
			}
			pins.forEach((pin, i) => {
				pin.style.left = `${Math.max(0, places[i])}px`;
				const button = pin.querySelector('button').getBoundingClientRect();
				const at = Number(pin.dataset.t) * width;
				const end = button.left - box.left + button.width / 2;
				const y = button.top - box.top;
				const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				path.setAttribute('d', `M ${at} 0 L ${at} 8 L ${end} ${Math.max(8, y)}`);
				wires.append(path);
			});
		}
		plot.setAttribute('data-packed', '');
	};
	const schedule = () => {
		if (scheduled) return;
		scheduled = true;
		requestAnimationFrame(layout);
	};
	schedule();
	new ResizeObserver(schedule).observe(plot);
	document.fonts?.ready.then(schedule);
}


// Eén toelichting tegelijk; touch gebruikt dezelfde markeringen als hover.
const closeMoments = () => {
	document.querySelectorAll('.scc-strip-pin[data-open]').forEach(item => {
		item.removeAttribute('data-open');
		item.querySelector('button').setAttribute('aria-expanded', 'false');
	});
};
document.addEventListener('click', event => {
	const button = event.target.closest('.scc-strip-hit');
	const item = button?.closest('.scc-strip-pin');
	const wasOpen = item?.hasAttribute('data-open');
	closeMoments();
	if (item && !wasOpen) {
		item.setAttribute('data-open', '');
		button.setAttribute('aria-expanded', 'true');
	}
});
document.addEventListener('keydown', event => {
	if (event.key === 'Escape') {
		closeMoments();
		document.activeElement?.closest('.scc-strip-hit')?.blur();
	}
});


// De opstellingen: onder lg is steeds één ploeg open (eerst Cambuur) en
// sluit openen van de ene de andere; vanaf lg staan beide open en doet de
// kop niets. Na een klik blijft de geopende kop in beeld, ook als de
// andere kaart erboven inklapt.
const folds = [...document.querySelectorAll('[data-lineup-fold]')];
const wide = matchMedia('(min-width: 1024px)');
let clicked = null;
const fold = () => folds.forEach((item) => { item.open = wide.matches || item.hasAttribute('data-cambuur'); });
fold();
wide.addEventListener('change', fold);
folds.forEach((item) => {
	item.querySelector(':scope > summary').addEventListener('click', (event) => {
		if (wide.matches) event.preventDefault();
		else clicked = item;
	});
	item.addEventListener('toggle', () => {
		if (wide.matches || !item.open) return;
		folds.forEach((other) => { if (other !== item) other.open = false; });
		if (clicked === item) item.scrollIntoView({ block: 'start', behavior: still() ? 'auto' : 'smooth' });
		clicked = null;
	});
});

// Een speler op het veld opent zijn rij in de tabel (een details met name:
// per tabel één open), scrolt ernaartoe en licht hem even op. Ook bij
// een link met #speler-… in de adresbalk; een ingeklapte opstelling gaat
// dan eerst open.
const openPlayer = (id, { scroll = true } = {}) => {
	const row = document.getElementById(id);
	if (!(row instanceof HTMLDetailsElement)) return;
	const outer = row.parentElement.closest('[data-lineup-fold]');
	if (outer) outer.open = true;
	row.open = true;
	row.classList.add('is-in');
	if (scroll) row.scrollIntoView({ block: 'center', behavior: still() ? 'auto' : 'smooth' });
	row.querySelector('summary')?.focus({ preventScroll: true });
	row.removeAttribute('data-flash');
	void row.offsetWidth;
	row.setAttribute('data-flash', '');
};

document.addEventListener('click', (event) => {
	const link = event.target.closest('[data-player]');
	if (!link) return;
	event.preventDefault();
	const id = link.getAttribute('href').slice(1);
	history.replaceState(null, '', `#${id}`);
	openPlayer(id);
});

if (location.hash.startsWith('#speler-')) openPlayer(location.hash.slice(1));
