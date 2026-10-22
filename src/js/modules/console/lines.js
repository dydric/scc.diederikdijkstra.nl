// Bestand: js/modules/console/lines.js
//
// Regels voor de klok en de vorige pagina. Elke regel heeft vormen van
// lang naar kort; het bord kiest de langste die past.

import { localDate, localOffset, localTime } from '../data/time.js';

export const PLACE_MS = 8000;
const SEP = '·';
const placeNow = (places) => places[Math.floor(Date.now() / PLACE_MS) % places.length] ?? '';

// Verdeel de vrije cellen over de tussenruimtes, met de plaats rechts.
export const spread = (parts, width) => {
	if (parts.length === 1) return parts[0].padEnd(width);
	const gaps = parts.length - 1;
	const free = width - parts.join('').length;
	return parts.reduce((line, part, i) => {
		if (i === 0) return part;
		const gap = Math.floor(free / gaps) + (i - 1 < free % gaps ? 1 : 0);
		return line + SEP.repeat(gap) + part;
	}, '');
};

// De eindregel blijft staan. Tijd en plaats komen uit de browser en uit
// site.location; op smalle schermen wisselen ze elkaar af.
export const now = (places, width) => {
	const time = localTime();
	const place = placeNow(places);
	const list = [
		[localDate(), time, localOffset(), place],
		[time, localOffset(), place],
		[time, place],
	];
	const fits = (parts) => parts.join(SEP).length <= width;
	const wide = list.find(fits);
	if (wide) return spread(wide, width);
	const short = Math.floor(Date.now() / (PLACE_MS / 2)) % 2
		? [[place], [place.split('/')[0]]]
		: [[time, localOffset()], [time]];
	return spread(short.find(fits) ?? short.at(-1), width);
};

export const READY = ['SYSTEMS READY · AWAITING INPUT', 'READY · AWAITING INPUT', 'AWAITING INPUT'];
export const LISTEN = ['STDIN OPEN · LISTENING', 'STDIN OPEN', 'LISTENING'];

// Onder de minimale breedte valt rechts een stuk van de pagina weg. De
// 404 gebruikt deze waarschuwingen in plaats van de gewone wachtstand.
export const MIN = 300;
export const narrow = () => innerWidth < MIN;
export const warn = (w) => [
	[`× VIEW ${w}PX < MIN ${MIN}PX`, `× VIEW ${w} < ${MIN}`, `× VIEW ${w}<${MIN}`],
	[`× CLIPPED ${MIN - w}PX ON THE RIGHT`, `× CLIPPED ${MIN - w}PX`],
	[`× MIN WIDTH ${MIN}PX`, `× MIN ${MIN}PX`],
	['× WIDEN THE WINDOW', '× WIDEN WINDOW'],
];
export const WARN = [0, 1, 2, 3].map((i) => () => ({ forms: warn(innerWidth)[i], warn: true }));

// De klok en de wachtduur op de startpagina.
export const clock = () => {
	const hm = localTime().slice(0, 5);
	return [`${localDate()} · ${hm} · ${localOffset()}`, `${hm} · ${localOffset()}`, hm];
};

export const idleFor = (since) => () => {
	const seconds = Math.floor((Date.now() - since()) / 1000);
	const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
	return [`IDLE ${elapsed} · NO INPUT YET`, `IDLE ${elapsed} · NO INPUT`, `IDLE ${elapsed}`];
};

const span = (ms) => {
	const s = Math.floor(ms / 1000);
	const pad = (n) => String(n).padStart(2, '0');
	return s < 6000 ? `${pad(Math.floor(s / 60))}:${pad(s % 60)}` : `${Math.floor(s / 3600)}H${pad(Math.floor(s / 60) % 60)}`;
};
const thing = ({ tag, label }) => ({ tag: `<${tag}>`, label: label ? `"${label}"` : '' });
const join = (...parts) => parts.filter(Boolean).join(' ');

export const clickOf = (visit) => {
	if (!visit?.click) return null;
	const { tag, label } = thing(visit.click);
	return [
		join('CLICK', tag, label, 'ON', visit.path.toUpperCase()),
		join('CLICK', tag, label),
		join('CLICK', label || tag),
		`CLICK ${tag}`,
		'CLICK',
	];
};

export const leftOf = (visit, n) => {
	if (!visit) return null;
	const path = visit.path.toUpperCase();
	const t = span(visit.ms);
	const seen = `SEEN ${visit.seen}%`;
	return [
		`PAGE ${n} · PREV ${path} · ${t} · ${seen}`,
		`PREV ${path} · ${t} · ${seen}`,
		`PREV ${t} · ${seen}`,
		`${t} · ${seen}`,
		`${seen} ${t}`,
		seen,
	];
};

// Een link of knop onder de muis, en de huidige sessie.
export const hoverOf = (hovered) => () => {
	const hover = hovered();
	if (!hover) return null;
	const { tag, label } = thing(hover);
	return [join('HOVER', tag, label), join('HOVER', label || tag), `HOVER ${tag}`, 'HOVER'];
};

export const sessionOf = (session) => () => {
	const current = session();
	if (!current) return null;
	const elapsed = span(current.ms);
	return [`PAGE ${current.n} THIS SESSION · ${elapsed} ON SITE`, `PAGE ${current.n} · ${elapsed} ON SITE`, `${elapsed} ON SITE`, `PAGE ${current.n}`];
};
