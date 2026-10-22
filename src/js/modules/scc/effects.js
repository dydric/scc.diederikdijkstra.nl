// Bestand: js/modules/scc/effects.js
//
// Kleine effecten voor de SCC-pagina's (css/components/scc-ui.css):
//   roll(el, value)   cijfers rollen door willekeurige cijfers naar de
//                     nieuwe waarde; andere tekens (–, ′) blijven staan.
//                     JetBrains Mono is monospace, dus niets verspringt.
//   decode(el, text)  pixeltekst verschijnt van links naar rechts uit
//                     blokjes.
//   countUp(el)       telt data-count op vanaf 0 (met data-suffix).
//   reveal(root)      zet .is-in op [data-reveal] zodra het in beeld komt.
// Met prefers-reduced-motion staat alles meteen in de eindstand.

export const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const DIGITS = '0123456789';

export function roll(el, value, { frames = 7, step = 34 } = {}) {
	const target = String(value);
	if (still() || el.textContent === target) {
		el.textContent = target;
		return;
	}
	clearInterval(el._roll);
	let frame = 0;
	el._roll = setInterval(() => {
		frame += 1;
		if (frame >= frames) {
			clearInterval(el._roll);
			el.textContent = target;
			return;
		}
		el.textContent = [...target].map((char) => /\d/.test(char) ? DIGITS[Math.floor(Math.random() * 10)] : char).join('');
	}, step);
}

const BLOCKS = '█▓▒░';

export function decode(el, text = el.textContent, { step = 28 } = {}) {
	const target = String(text);
	if (still()) {
		el.textContent = target;
		return;
	}
	clearInterval(el._decode);
	let shown = 0;
	el._decode = setInterval(() => {
		shown += 1;
		el.textContent = [...target].map((char, index) => {
			if (index < shown - 2 || char === ' ') return char;
			if (index < shown) return BLOCKS[Math.floor(Math.random() * BLOCKS.length)];
			return index < shown + 3 ? '░' : ' ';
		}).join('');
		if (shown > target.length + 2) {
			clearInterval(el._decode);
			el.textContent = target;
		}
	}, step);
}

export function countUp(el, duration = 900) {
	const raw = el.dataset.count;
	const end = parseFloat(String(raw).replace('+', ''));
	if (!Number.isFinite(end) || still()) return;
	const prefix = String(raw).startsWith('+') ? '+' : '';
	const suffix = el.dataset.suffix ?? '';
	const start = performance.now();
	const tick = (now) => {
		const t = Math.min(1, (now - start) / duration);
		const eased = 1 - Math.pow(1 - t, 3);
		el.textContent = `${prefix}${Math.round(end * eased)}${suffix}`;
		if (t < 1) requestAnimationFrame(tick);
		else el.textContent = `${raw}${suffix && !String(raw).endsWith(suffix) ? suffix : ''}`;
	};
	el.textContent = `${prefix}0${suffix}`;
	requestAnimationFrame(tick);
}

export function reveal(root = document) {
	const items = root.querySelectorAll('[data-reveal]');
	if (still() || !('IntersectionObserver' in window)) {
		items.forEach((item) => item.classList.add('is-in'));
		return;
	}
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			entry.target.classList.add('is-in');
			entry.target.querySelectorAll('[data-count]').forEach((el) => countUp(el));
			observer.unobserve(entry.target);
		}
	}, { rootMargin: '0px 0px -15% 0px' });
	items.forEach((item) => observer.observe(item));
}
