// Bestand: js/components/scc-archive.js
//
// Het overzicht (scc/view/index.njk).
//   Scrollen: rijen trekken hun lijn en verschijnen met een rollende
//   uitslag; panelen met data-reveal (topscorers, profiel) bouwen op.
//   De vormblokjes en de rijen wijzen elkaar aan bij hover.
//   De wedstrijd onder de muis of in het midden van het scherm gaat als
//   event "scc:match" naar document: voor de dock (docs/componenten/dock.md).

import { roll, reveal, still } from '../modules/scc/effects.js';

const rows = [...document.querySelectorAll('[data-row]')];
const cells = [...document.querySelectorAll('.scc-form-cell')];
let active = null;


reveal();

function activate(row) {
	if (!row || row === active) return;
	active = row;
	for (const cell of cells) cell.toggleAttribute('data-active', cell.dataset.match === row.dataset.url);
	const link = row.querySelector('a');
	document.dispatchEvent(new CustomEvent('scc:match', { detail: {
		url: row.dataset.url,
		opponent: row.querySelector('.scc-row-opponent')?.firstChild?.textContent.trim(),
		date: row.querySelector('time')?.getAttribute('datetime'),
		score: row.querySelector('.scc-row-score')?.textContent,
		result: row.dataset.result,
		title: link?.textContent.replace(/\s+/g, ' ').trim(),
	} }));
}

if ('IntersectionObserver' in window && rows.length && !still()) {
	const enter = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			const row = entry.target;
			row.classList.add('is-in');
			const score = row.querySelector('.scc-row-score');
			if (score) roll(score, score.textContent, { frames: 8, step: 35 });
			enter.unobserve(row);
		}
	}, { rootMargin: '0px 0px -8% 0px' });
	rows.forEach((row) => enter.observe(row));

	const center = new IntersectionObserver((entries) => {
		for (const entry of entries) if (entry.isIntersecting) activate(entry.target);
	}, { rootMargin: '-50% 0px -50% 0px' });
	rows.forEach((row) => center.observe(row));
} else {
	rows.forEach((row) => row.classList.add('is-in'));
}

rows.forEach((row) => row.addEventListener('pointerenter', () => activate(row)));
cells.forEach((cell) => cell.addEventListener('pointerenter', () => {
	const row = rows.find((item) => item.dataset.url === cell.dataset.match);
	activate(row);
}));
