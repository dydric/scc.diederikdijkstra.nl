// Bestand: js/modules/scc/sides.js
//
// De harde kern naast de pagina (.scc-sides, css/pages/scc.css): een vaste
// laag achter alles die alleen in de marges naast de inhoud te zien is.
// Twee canvassen: het publiek, een dichte staande massa in vooral zwart en
// donkerblauw met hier en daar geel, sjaals en armen omhoog, in perspectief
// en van de veldkant belicht; en daarover trage wolken gele en blauwe rook,
// het enige dat beweegt. De CSS zet beide onscherp.
//
//   sides(element, content, { venue })
//                             tekent in element naast content (de
//                             container van de pagina). Bij venue away sta
//                             je in het uitvak: hetzelfde publiek achter de
//                             hekken. Zet --sides-left en --sides-right op
//                             element: de randen van de inhoud, voor het
//                             masker in de CSS.
//
// Alleen bij een marge van minstens 64px; is er geen ruimte, dan draait er
// niets. Een verborgen tabblad pauzeert; met prefers-reduced-motion staat
// de rook stil.

const MIN = 64;
const COLORS = { yellow: '255 211 26', blue: '64 98 236' };

// Kleding van de harde kern: vooral zwart, donkerblauw en grijs, wat geel.
const CLOTHES = [
	[.52, '12 13 16'], [.22, '22 27 46'], [.13, '40 42 48'], [.06, '230 186 36'], [.04, '40 64 180'], [.03, '170 168 162'],
];
const pick = (list, value) => {
	for (const [share, color] of list) {
		if (value < share) return color;
		value -= share;
	}
	return list[0][1];
};

// Een zachte wolk als sjabloon per kleur, eenmaal getekend.
function puffSprite(color) {
	const sprite = document.createElement('canvas');
	sprite.width = sprite.height = 128;
	const ctx = sprite.getContext('2d');
	const fill = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
	fill.addColorStop(0, `rgb(${color} / 1)`);
	fill.addColorStop(.5, `rgb(${color} / .4)`);
	fill.addColorStop(1, `rgb(${color} / 0)`);
	ctx.fillStyle = fill;
	ctx.fillRect(0, 0, 128, 128);
	return sprite;
}

// Het publiek in een marge: rijen van ver (klein, hoog) naar dichtbij
// (groot, onderaan). Ieder een romp en een hoofd; sommigen met de armen
// omhoog of een sjaal boven het hoofd. Licht van de kant van het veld
// (edge), naar boven toe donkerder.
function crowd(ctx, [from, to], edge, height) {
	let seed = Math.round(from) + 1923;
	const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
	const top = height * .28;
	for (let y = top; y < height + 40;) {
		const t = (y - top) / (height - top);
		const size = 5 + t * 13;
		for (let x = from - size + random() * size; x < to + size; x += size * (1.5 + random() * .5)) {
			const near = 1 - Math.min(1, Math.abs(x - edge) / Math.max(1, to - from));
			const light = (.1 + t * .26) * (.5 + near * .5) * (.7 + random() * .3);
			const cx = x + (random() - .5) * size * .4, cy = y + (random() - .5) * size * .3;
			// Romp.
			ctx.fillStyle = `rgb(${pick(CLOTHES, random())} / ${Math.min(1, light * 1.4)})`;
			ctx.beginPath();
			ctx.ellipse(cx, cy + size * 1.7, size * 1.05, size * 1.2, 0, 0, Math.PI * 2);
			ctx.fill();
			// Hoofd, door het licht van het veld net zichtbaar.
			ctx.fillStyle = `rgb(150 118 100 / ${light * .7})`;
			ctx.beginPath();
			ctx.ellipse(cx, cy, size * .48, size * .58, 0, 0, Math.PI * 2);
			ctx.fill();
			const gesture = random();
			if (gesture < .06) {
				// Een sjaal boven het hoofd, geel-blauw.
				const color = random() < .6 ? COLORS.yellow : COLORS.blue;
				ctx.fillStyle = `rgb(${color} / ${light * 1.1})`;
				ctx.fillRect(cx - size * 1.6, cy - size * 1.5, size * 3.2, size * .45);
			} else if (gesture < .16) {
				// Armen omhoog.
				ctx.strokeStyle = `rgb(26 26 30 / ${Math.min(1, light * 1.4)})`;
				ctx.lineWidth = size * .32;
				ctx.beginPath();
				ctx.moveTo(cx - size * .8, cy + size * .9);
				ctx.lineTo(cx - size * 1.1, cy - size * 1.4);
				ctx.moveTo(cx + size * .8, cy + size * .9);
				ctx.lineTo(cx + size * 1.1, cy - size * 1.4);
				ctx.stroke();
			}
		}
		y += size * (.95 + random() * .2);
	}
}

// De hekken van het uitvak voor het publiek: dichte stalen spijlen met
// een bovenregel en een middenregel, palen om de zoveel meter. Donker,
// als silhouet tegen het licht van het veld.
function fence(ctx, [from, to], height) {
	const top = height * .46;
	for (let x = from - 4; x < to + 4; x += 13) {
		ctx.fillStyle = 'rgb(8 9 11 / .8)';
		ctx.fillRect(x, top, 2, height - top);
	}
	ctx.fillStyle = 'rgb(6 7 9 / .92)';
	for (let x = from + 40; x < to; x += 150) ctx.fillRect(x, top - 10, 6, height);
	ctx.fillRect(from - 4, top - 10, to - from + 8, 5);
	ctx.fillRect(from - 4, top + (height - top) * .42, to - from + 8, 4);
}

export function sides(element, content, { venue = 'home' } = {}) {
	const away = venue === 'away';
	const [people, haze] = ['crowd', 'smoke'].map(layer => {
		const canvas = document.createElement('canvas');
		canvas.className = 'scc-sides-canvas';
		canvas.dataset.layer = layer;
		element.append(canvas);
		return canvas;
	});
	const ctx = haze.getContext('2d');
	const still = matchMedia('(prefers-reduced-motion: reduce)');
	const sprites = { yellow: puffSprite(COLORS.yellow), blue: puffSprite(COLORS.blue) };
	let width = 0, height = 0, margins = [], puffs = [];
	let running = false, last = 0;

	// Een rookwolk die vanuit het publiek traag omhoog drijft en uitdijt;
	// age > 0 laat hem al onderweg zijn.
	const puff = ([from, to], age = 0) => {
		const p = {
			x: from + Math.random() * (to - from), y: height * (.7 + Math.random() * .4),
			vx: (Math.random() - .5) * 6, vy: -(5 + Math.random() * 8),
			r: 90 + Math.random() * 110, grow: 4 + Math.random() * 6,
			life: 22 + Math.random() * 16, age: 0,
			color: Math.random() < .55 ? 'yellow' : 'blue',
			peak: .1 + Math.random() * .1, margin: [from, to],
		};
		step(p, age);
		return p;
	};
	const step = (p, dt) => {
		p.age += dt;
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.r += p.grow * dt;
	};

	const measure = () => {
		width = innerWidth;
		height = innerHeight;
		for (const canvas of [people, haze]) {
			canvas.width = width;
			canvas.height = height;
		}
		const box = content.getBoundingClientRect();
		const style = getComputedStyle(content);
		const left = box.left + parseFloat(style.paddingLeft);
		const right = box.right - parseFloat(style.paddingRight);
		element.style.setProperty('--sides-left', `${left}px`);
		element.style.setProperty('--sides-right', `${right}px`);
		margins = [[0, left - 12, left], [right + 12, width, right]].filter(([from, to]) => to - from >= MIN);
		const crowdCtx = people.getContext('2d');
		crowdCtx.clearRect(0, 0, width, height);
		for (const [from, to, edge] of margins) {
			crowd(crowdCtx, [from, to], edge, height);
			if (away) fence(crowdCtx, [from, to], height);
		}
		puffs = margins.flatMap(([from, to]) => Array.from(
			{ length: Math.min(14, 4 + Math.round((to - from) / 40)) },
			() => puff([from, to], Math.random() * 30),
		));
	};

	const draw = () => {
		ctx.clearRect(0, 0, width, height);
		for (const p of puffs) {
			const alpha = Math.sin(Math.PI * Math.min(1, p.age / p.life)) * p.peak;
			if (alpha <= 0) continue;
			ctx.globalAlpha = alpha;
			ctx.drawImage(sprites[p.color], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
		}
		ctx.globalAlpha = 1;
	};

	const tick = now => {
		if (!running) return;
		const dt = Math.min(.05, (now - last) / 1000 || 0);
		last = now;
		for (const [i, p] of puffs.entries()) {
			step(p, dt);
			if (p.age >= p.life) puffs[i] = puff(p.margin);
		}
		draw();
		requestAnimationFrame(tick);
	};

	const update = () => {
		const wanted = margins.length > 0 && !still.matches && !document.hidden;
		if (wanted && !running) {
			running = true;
			last = performance.now();
			requestAnimationFrame(tick);
		} else if (!wanted) {
			running = false;
			draw();
		}
	};

	new ResizeObserver(() => {
		if (innerWidth === width && innerHeight === height) return;
		measure();
		draw();
		update();
	}).observe(document.documentElement);
	document.addEventListener('visibilitychange', update);
	still.addEventListener('change', update);
	measure();
	draw();
	people.dataset.ready = haze.dataset.ready = '';
	update();
}
