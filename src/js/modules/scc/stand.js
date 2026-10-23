// Bestand: js/modules/scc/stand.js
//
// Het Kooi Stadion achter de homehero (.scc-stand, css/pages/scc.css): de
// noordtribune, gezien vanaf het veld, als sfeerbeeld. De hero staat scherp
// op de voorgrond; de tribune erachter is licht onscherp, zoals op een foto,
// met gloed en nevel in het licht van de masten.
//
// De tribune is even breed als de hero en sluit direct aan op de
// voorspellingsbalk, die zo de boarding is. Twee ringen blauwe stoeltjes
// met lichte trappen; gele stoelen vormen boven WIJ ZIJN en onder CAMBUUR.
// Het is bijna altijd uitverkocht: het publiek bedekt de meeste stoelen,
// zodat de tekst er hier en daar doorheen schemert; aan de zijkanten zijn
// meer stoelen leeg. Daarboven een plat dak met een blauwe bannerstrook en
// op de uiteinden de vakwerkmasten. Het logo ligt over dak en bovenring.
//
//   stand(element, hero, { result })
//                           tekent het stadion in element en volgt het
//                           licht van het veld in de hero (data-light van
//                           turf.js): avond of middag met de schaduw van
//                           het dak. De masten branden altijd; de lucht
//                           volgt de zon boven Leeuwarden midden in de
//                           wedstrijd (data-kickoff plus 45 minuten): blauw
//                           overdag, schemering, donker 's avonds. Hoe
//                           donkerder, hoe sterker de bundels en de nevel;
//                           flitsers alleen in het donker.
//                           result (winst, gelijk, verlies) kleurt de
//                           stemming: bij winst meer flitsers, bij verlies
//                           minder en meer lege plekken. Zet --stand-front
//                           op het ouderelement: de onderkant van de tribune.
//
// Er tekent alleen iets bij een nieuwe breedte of een ander licht. Zonder JS
// blijft alleen de CSS-gloed staan; met prefers-reduced-motion geen flitsers.

// Hoogtes in px vanaf de bovenkant: het dak en de eerste rij stoelen.
// Boven het dak staan de masten.
const ROOF = 68;
const BANNER = ROOF + 12;
const SEATS = ROOF + 20;
// De tekst per ring; elke letter (en elke spatie) is een vak. Het lege vak
// in het midden van de bovenring ligt onder het logo.
const UPPER = ' WIJ ZIJN';
const LOWER = 'CAMBUUR';

// De tribune volgt de randen van de hero (edges, in px binnen element);
// zonder hero het midden van het scherm. De masten staan op de uiteinden
// van het dak en hellen naar binnen (d). Een rij stoelen is step hoog; de
// bovenring heeft 7 rijen, de onderring 9.
export function layout(width, edges) {
	const [left, right] = edges ?? [width * .08, width * .92];
	const step = width < 640 ? 4 : 5;
	const upper = [SEATS, SEATS + 7 * step];
	const lower = [upper[1] + 2 * step, upper[1] + 11 * step];
	const inset = Math.max(18, Math.min(40, width * .025));
	return { left, right, step, upper, lower, front: lower[1] + 2, masts: [[left + inset, 1], [right - inset, -1]] };
}

// De tekst in de stoelen: elke letter midden in een eigen vak van de ring,
// zodat de trappen ertussen vallen, zo groot als de ring hoog is. Geeft
// een masker (alpha) terug.
function lettering(width, height, { left, right, upper, lower }) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	const family = getComputedStyle(document.body).fontFamily;
	ctx.fillStyle = '#fff';
	ctx.textAlign = 'center';
	const span = right - left;
	for (const [text, [top, bottom]] of [[UPPER, upper], [LOWER, lower]]) {
		const slot = span / text.length;
		const cap = (bottom - top) * .82;
		let size = cap / .72;
		ctx.font = `800 ${size}px ${family}`;
		const widest = Math.max(...[...text].map(char => ctx.measureText(char).width));
		if (widest > slot * .86) size *= slot * .86 / widest;
		ctx.font = `800 ${size}px ${family}`;
		[...text].forEach((char, i) => ctx.fillText(char, left + (i + .5) * slot, top + (bottom - top + size * .72) / 2));
	}
	const { data } = ctx.getImageData(0, 0, width, height);
	return (x, y) => data[(Math.round(y) * width + Math.round(x)) * 4 + 3] > 110;
}

// Kleding van het publiek: veel geel en donker, wat blauw, grijs en wit.
const CROWD = [
	[.3, '255 205 40'], [.36, '18 20 28'], [.13, '44 72 200'], [.12, '140 142 148'], [.09, '222 220 212'],
];
function shirt(pick) {
	for (const [share, color] of CROWD) {
		if (pick < share) return color;
		pick -= share;
	}
	return CROWD[1][1];
}

// De hoogte van de zon in graden boven Leeuwarden op een moment (een
// vereenvoudigde zonnestand, op een paar tienden van een graad nauwkeurig).
function sunAltitude(date, lat = 53.2, lon = 5.8) {
	const rad = Math.PI / 180;
	const d = date / 864e5 - 10957.5;
	const g = (357.529 + .98560028 * d) * rad;
	const q = 280.459 + .98564736 * d;
	const L = (q + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * rad;
	const e = (23.439 - 3.6e-7 * d) * rad;
	const dec = Math.asin(Math.sin(e) * Math.sin(L));
	const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
	const hour = ((18.697374558 + 24.06570982441908 * d) % 24) * 15 + lon;
	const ha = hour * rad - ra;
	return Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha)) / rad;
}

// De lucht per zonnestand: boven en aan de horizon (bij de dakrand),
// gedempt naar het donker van de site; dark is 0 overdag en 1 's nachts.
const SKY = [
	[-14, [7, 9, 15], [12, 17, 30], 1],
	[-8, [10, 18, 44], [24, 36, 72], .92],
	[-3, [20, 34, 78], [92, 64, 86], .75],
	[2, [34, 66, 120], [176, 120, 82], .5],
	[10, [44, 92, 156], [128, 160, 196], .2],
	[25, [50, 104, 172], [150, 180, 212], 0],
];
export function sky(kickoff) {
	const time = Date.parse(kickoff);
	if (isNaN(time)) return { top: SKY[0][1], horizon: SKY[0][2], dark: 1 };
	const altitude = sunAltitude(time + 45 * 6e4);
	const i = SKY.findIndex(([at]) => at > altitude);
	if (i <= 0) {
		const [, top, horizon, dark] = SKY[i === 0 ? 0 : SKY.length - 1];
		return { top, horizon, dark };
	}
	const [a, b] = [SKY[i - 1], SKY[i]];
	const t = (altitude - a[0]) / (b[0] - a[0]);
	const mix = (x, y) => x.map((v, k) => Math.round(v + (y[k] - v) * t));
	return { top: mix(a[1], b[1]), horizon: mix(a[2], b[2]), dark: a[3] + (b[3] - a[3]) * t };
}

const mastUnit = width => Math.max(.5, Math.min(.78, width / 1440 * .78));

// De tribune zelf: hoeken, ringen met publiek en dak. Scherp getekend;
// draw zet hem onscherp op het scherm.
function scene(ctx, width, height, frame, evening, random, { result }) {
	const { left, right, step, upper, lower } = frame;
	const span = right - left, center = (left + right) / 2;
	const yellow = lettering(width, height, frame);
	// Na een nederlaag is een deel eerder naar huis.
	const leave = result === 'verlies' ? .16 : 0;

	// De open hoeken: gevelwanden die zacht uit de lucht opkomen en in het
	// donker verdwijnen, zonder harde rand.
	for (const [from, to] of [[0, left - 10], [right + 10, width]]) {
		const wall = ctx.createLinearGradient(0, ROOF, 0, height * .6);
		wall.addColorStop(0, 'rgb(8 10 13 / 0)');
		wall.addColorStop(.25, 'rgb(8 10 13 / .45)');
		wall.addColorStop(1, 'rgb(8 10 13 / 0)');
		ctx.fillStyle = wall;
		ctx.fillRect(from, ROOF, to - from, height);
	}

	// De ringen: stoelen in blauw of geel, met daarover het publiek.
	const rings = [
		{ rows: upper, blocks: UPPER.length, light: evening ? .55 : .45 },
		{ rows: lower, blocks: LOWER.length, light: evening ? .8 : 1 },
	];
	for (const { rows: [top, bottom], blocks, light } of rings) {
		const stairs = Array.from({ length: blocks + 1 }, (_, i) => left + i * span / blocks);
		ctx.fillStyle = `rgb(205 210 214 / ${light * .08})`;
		for (const x of stairs) ctx.fillRect(x - step * .6, top, step * 1.2, bottom - top);
		for (let y = top; y < bottom - step * .3; y += step) {
			for (let x = left + step; x < right - step; x += step) {
				if (stairs.some(edge => Math.abs(x + step / 2 - edge) < step)) continue;
				const tint = yellow(x + step / 2, y + step / 2);
				ctx.fillStyle = tint ? `rgb(255 211 26 / ${light * .9})` : `rgb(48 82 226 / ${light * .6})`;
				ctx.fillRect(x + step * .1, y + step * .15, step * .8, step * .7);
				// Bijna uitverkocht; naar de zijkanten meer lege stoelen.
				const side = Math.abs(x - center) / (span / 2);
				if (random() > .93 - side * side * .3 - leave) continue;
				const lit = light * (.7 + random() * .3);
				ctx.fillStyle = `rgb(${shirt(random())} / ${lit})`;
				ctx.fillRect(x + step * .2, y + step * .3, step * .6, step * .7);
				ctx.fillStyle = `rgb(226 188 160 / ${lit * .7})`;
				ctx.fillRect(x + step * .35, y, step * .3, step * .3);
			}
		}
	}

	// Het looppad tussen de ringen, met publiek dat er nog staat.
	ctx.fillStyle = `rgb(150 156 164 / ${evening ? .18 : .26})`;
	ctx.fillRect(left, upper[1], span, lower[0] - upper[1]);
	for (let x = left; x < right; x += step * (1 + random() * 3)) {
		ctx.fillStyle = `rgb(${shirt(random())} / ${evening ? .45 : .6})`;
		ctx.fillRect(x, upper[1] + step * .4, step * .6, step * 1.2);
	}

	// Het dak: donker, met een lichte rand en de blauwe bannerstrook.
	ctx.fillStyle = evening ? '#050608' : '#0e1114';
	ctx.fillRect(left - 16, ROOF, span + 32, SEATS - ROOF);
	ctx.fillStyle = `rgb(220 226 232 / ${evening ? .22 : .5})`;
	ctx.fillRect(left - 16, ROOF, span + 32, 2);
	ctx.fillStyle = `rgb(30 56 180 / ${evening ? .5 : .7})`;
	ctx.fillRect(left, BANNER, span, SEATS - BANNER - 1);

}

// De lichtmasten, zoals in het Kooi: een vakwerk met een staande paal,
// een ladderarm die schuin naar het veld helt en bovenin een schuin frame
// met lampen. Maten in een eigen eenheid (u naar het veld, v omhoog),
// geschaald met de breedte. Ze staan scherper dan de tribune, als silhouet.
function towers(ctx, width, { masts }, evening) {
	const unit = mastUnit(width);
	ctx.strokeStyle = evening ? 'rgb(150 158 166 / .5)' : 'rgb(196 204 212 / .55)';
	for (const [x0, d] of masts) {
		const at = (u, v) => [x0 + d * u * unit, ROOF - v * unit];
		const line = (u1, v1, u2, v2, w = 1) => {
			ctx.lineWidth = w;
			ctx.beginPath();
			ctx.moveTo(...at(u1, v1));
			ctx.lineTo(...at(u2, v2));
			ctx.stroke();
		};
		line(-24, 0, -24, 44, 1.6);
		line(0, 0, 18, 68, 1.3);
		line(-7, 1, 11, 68, 1.3);
		line(-24, 44, 14, 64, 1.1);
		line(-24, 4, 10, 40, .9);
		line(-24, 36, 2, 8, .9);
		line(-16, 50, 10, 50, 1.2);
		line(10, 58, 34, 74, 1.6);
		ctx.fillStyle = '#fffaf0';
		for (const [u0, v0] of [[11, 61], [15, 67]]) {
			for (let i = 0; i < 6; i++) {
				const [x, y] = at(u0 + i * 3.9, v0 + i * 2.6);
				ctx.fillRect(x - 2 * unit, y - 1.2 * unit, 4 * unit, 2.4 * unit);
			}
		}
	}
}

// Een canvas op schermresolutie, leeg, met de context in CSS-pixels.
function prepare(canvas) {
	const width = canvas.clientWidth, height = canvas.clientHeight;
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	canvas.width = Math.round(width * dpr);
	canvas.height = Math.round(height * dpr);
	const ctx = canvas.getContext('2d');
	ctx.scale(dpr, dpr);
	ctx.clearRect(0, 0, width, height);
	return ctx;
}

// Twee lagen: back is de tribune, die de CSS onscherp zet (een filter op
// het canvas werkt in elke browser; ctx.filter niet). Zo ligt de
// scherptediepte bij de hero. Light draagt de masten, het licht en de
// nevel, scherp en opgeteld (mix-blend-mode: screen).
function draw(back, light, mode, edges, options, dark) {
	const width = back.clientWidth, height = back.clientHeight;
	const evening = mode !== 'middag';
	const frame = layout(width, edges);
	const { left, right, step, upper, lower, front, masts } = frame;
	let seed = 1964;
	const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

	let ctx = prepare(back);
	scene(ctx, width, height, frame, evening, random, options);
	// Schaduw onder het dak en een vignet naar de zijkanten.
	const roof = ctx.createLinearGradient(0, SEATS, 0, SEATS + step * 5);
	roof.addColorStop(0, 'rgb(4 5 8 / .55)');
	roof.addColorStop(1, 'rgb(4 5 8 / 0)');
	ctx.fillStyle = roof;
	ctx.fillRect(left, SEATS, right - left, step * 5);
	const vignette = ctx.createLinearGradient(0, 0, width, 0);
	vignette.addColorStop(0, 'rgb(8 9 12 / .75)');
	vignette.addColorStop(Math.max(.01, left / width), 'rgb(8 9 12 / .25)');
	vignette.addColorStop(.5, 'rgb(8 9 12 / 0)');
	vignette.addColorStop(Math.min(.99, right / width), 'rgb(8 9 12 / .25)');
	vignette.addColorStop(1, 'rgb(8 9 12 / .75)');
	ctx.fillStyle = vignette;
	ctx.fillRect(0, 0, width, height);

	ctx = prepare(light);
	towers(ctx, width, frame, evening);

	// Licht en nevel; overdag valt het minder op dan in het donker.
	ctx.globalCompositeOperation = 'lighter';
	const unit = mastUnit(width);
	const amount = .35 + .65 * dark;
	const glow = (x, y, radius, color, alpha) => {
		alpha *= amount;
		const fill = ctx.createRadialGradient(x, y, 0, x, y, radius);
		fill.addColorStop(0, `rgb(${color} / ${alpha})`);
		fill.addColorStop(.3, `rgb(${color} / ${alpha * .25})`);
		fill.addColorStop(1, `rgb(${color} / 0)`);
		ctx.fillStyle = fill;
		ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
	};
	{
		for (const [x0, d] of masts) {
			const head = [x0 + d * 24 * unit, ROOF - 68 * unit];
			// De bundel waaiert in de nevel uit naar het veld; vier lagen van
			// smal naar breed geven hem zachte randen.
			const beam = ctx.createLinearGradient(0, head[1], 0, front + 120);
			beam.addColorStop(0, `rgb(255 240 210 / ${.03 * amount})`);
			beam.addColorStop(1, 'rgb(255 240 210 / 0)');
			ctx.fillStyle = beam;
			const aim = head[0] + d * (right - left) * .3;
			for (const spread of [50, 90, 130, 170]) {
				ctx.beginPath();
				ctx.moveTo(head[0] - spread * .08, head[1]);
				ctx.lineTo(head[0] + spread * .08, head[1]);
				ctx.lineTo(aim + spread, front + 120);
				ctx.lineTo(aim - spread, front + 120);
				ctx.fill();
			}
			glow(...head, 190 * unit, '255 244 220', .55);
			glow(...head, 26 * unit, '255 252 240', .7);
		}
		// Nevel boven het publiek en het schijnsel van het veld op de onderring.
		for (let i = 0; i < 9; i++) {
			const x = left + random() * (right - left);
			glow(x, upper[0] + random() * (lower[1] - upper[0]), 140 + random() * 180, '255 236 200', .06);
		}
		const spill = ctx.createLinearGradient(0, upper[0], 0, front);
		spill.addColorStop(0, 'rgb(255 240 210 / 0)');
		spill.addColorStop(1, `rgb(255 240 210 / ${.14 * amount})`);
		ctx.fillStyle = spill;
		ctx.fillRect(left, upper[0], right - left, front - upper[0]);
	}
	if (!evening) {
		// Middag: zon op de onderring.
		const sun = ctx.createLinearGradient(0, lower[0], 0, front);
		sun.addColorStop(0, 'rgb(255 236 200 / .03)');
		sun.addColorStop(1, 'rgb(255 236 200 / .1)');
		ctx.fillStyle = sun;
		ctx.fillRect(left, lower[0], right - left, front - lower[0]);
	}
	ctx.globalCompositeOperation = 'source-over';
}

export function stand(element, hero, options = {}) {
	const panel = hero?.querySelector('[data-turf]');
	const [canvas, light] = ['back', 'light'].map(layer => {
		const node = document.createElement('canvas');
		node.className = 'scc-stand-canvas';
		node.dataset.layer = layer;
		element.append(node);
		return node;
	});
	const still = matchMedia('(prefers-reduced-motion: reduce)');
	const mode = () => panel?.dataset.light ?? 'avond';
	const air = () => sky(panel?.dataset.kickoff);
	// De randen van de hero binnen de tribunelaag.
	const edges = () => {
		if (!hero) return undefined;
		const box = element.getBoundingClientRect(), card = hero.getBoundingClientRect();
		return [card.left - box.left, card.right - box.left];
	};
	let width = 0, drawn = '';

	const render = () => {
		const at = edges();
		const { top, horizon, dark } = air();
		const key = `${canvas.clientWidth}:${at}:${mode()}:${top}:${horizon}`;
		if (key === drawn) return;
		drawn = key;
		element.style.setProperty('--sky-top', `rgb(${top})`);
		element.style.setProperty('--sky-horizon', `rgb(${horizon})`);
		draw(canvas, light, mode(), at, options, dark);
		element.parentElement.style.setProperty('--stand-front', `${layout(canvas.clientWidth, at).front}px`);
		canvas.dataset.ready = light.dataset.ready = '';
	};
	// De tekst gebruikt het fontbestand van de site; wacht daarop.
	document.fonts.ready.then(() => new ResizeObserver(() => {
		if (canvas.clientWidth === width) return;
		width = canvas.clientWidth;
		render();
	}).observe(canvas));
	if (panel) new MutationObserver(render).observe(panel, { attributes: true, attributeFilter: ['data-light', 'data-kickoff'] });

	// Flitsers: in het donker af en toe een telefoon op de tribune, niet
	// achter het logo. Bij winst vaker, bij verlies minder.
	let visible = true;
	new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(element);
	const flash = () => {
		const pace = { winst: .6, verlies: 2.2 }[options.result] ?? 1;
		setTimeout(flash, (700 + Math.random() * 2600) * pace);
		if (!visible || document.hidden || still.matches || air().dark < .6) return;
		const { left, right, upper, lower } = layout(element.clientWidth, edges());
		const x = left + Math.random() * (right - left);
		const y = upper[0] + Math.random() * (lower[1] - upper[0]);
		if (Math.abs(x - (left + right) / 2) < 48 && y < upper[1]) return;
		const dot = document.createElement('span');
		dot.className = 'scc-stand-flash';
		dot.style.translate = `${x}px ${y}px`;
		dot.addEventListener('animationend', () => dot.remove(), { once: true });
		element.append(dot);
	};
	setTimeout(flash, 1200);
}
