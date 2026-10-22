// Bestand: js/modules/effects/ticker.js
//
// Het tickerbord: een rij cellen (partials/ticker.njk), elk één teken in
// JetBrains Mono, en elke cel klapt op z'n eigen moment naar een ander
// teken, zoals een stationsbord. Hele cellen: een teken wordt een ander
// teken, geen transform of fade (docs/archief/effecten.md, "Regels").
//
// Een wissel van één cel, in stappen van STEP ms (per wissel gekozen, dus
// haperend):
//
//   oud → 0–3 tekens uit de rol → ▀ → ▄ → nieuw
//
// De rol zijn tekens uit dezelfde set als het doel, zodat je ziet wat er
// langs komt. Met kans ERROR landt de cel eerst op een foutteken (▚ ¤ ? …),
// geïnverteerd ([data-ticker-error]), hapert even, en klapt dan alsnog naar
// het doel. Rustig (quiet, een cijfer dat een ander cijfer wordt, zoals de
// seconden): alleen de klep, zonder rol en zonder fout.
//
// Van buitenaf: flip(cel, teken) één cel; set(tekst) laat de cellen die
// anders zijn wisselen, van links, STAGGER ms na elkaar; shift(teken)
// schuift de rij een cel naar links en zet het teken rechts, vóór de
// cursor (cursor(teken), de laatste cel). Een modus (MODES) beslist zelf
// wat er wanneer verandert:
//
//   random   om de 0,4–1,6 s één cel, soms een rijtje van 2–6 na elkaar,
//            naar een willekeurig teken uit de set
//   console  een band die naar links loopt: elke regel (write(vormen),
//            van lang naar kort; de langste die op de rij past)
//            schuift rechts naar binnen, een teken per 7–15 ms, met
//            rechts de cursor (▄, en █ als hij stilstaat), en loopt door
//            tot hij links staat: daar is hij helemaal te lezen, en daar
//            staat hij even stil. Dan duwt de volgende hem eruit. Past een
//            vorm niet, dan stopt hij als het eind binnen is. Begint
//            leeg. Een deel van de tekens komt versleuteld binnen (ruis,
//            soms een fout) en loopt zo mee; staat de regel links, dan
//            ontcijfert hij eerst, cel voor cel van links (met de klep).
//            write(regel, { pass: true }): de regel loopt voorbij zonder
//            te stoppen, ook als hij langer is dan de rij, iets trager en
//            in stukjes (CONSOLE.chunk); met fast: true op het tempo van
//            typen, zonder stukjes.
//            end(tekst): zo ook, maar die blijft staan en mag tot de
//            rand: het laatste teken komt op de cel van de cursor. Daarna wisselt set(tekst) de cellen die veranderen (de
//            tijd, de plaats). De set doet hier niet mee.
//            write(regel, { enter }): enter() zodra de regel aan de beurt
//            is en binnen begint te lopen (at() pas als hij links staat).
//            write(regel, { brief: true }): daarna maar kort stil.
//            write(regel, { warn: true }): een melding, in het rood
//            ([data-ticker-warn], loopt mee met de band).
//            idle(teksten): staat er niets meer in de rij, dan wisselt de
//            regel die staat om de 2–4 s naar de volgende tekst: de cellen
//            versleutelen van links en ontcijferen dan (morph()). Teksten
//            (een lijst, of een functie die er een geeft, elke keer
//            opnieuw) als vormen, een functie die ze geeft (of null: dan
//            overslaan), of { forms, warn } voor een melding, met hold:
//            zoveel ms blijft hij staan (anders CONSOLE.idle). Stopt bij de
//            volgende write(). De cursor knippert zolang (BLINK).
//            patch(vormen): de regel die links staat bijwerken (een
//            teller, terwijl at() loopt).
//            Geen ritme: om de paar tekens een ander tempo (sneller,
//            trager, slepend), soms blijft hij even haken, soms staat een
//            regel langer stil, en het ontcijferen gaat elke keer anders
//            snel.
//
// Een nieuwe modus: een functie (ticker, set) → { tick }, waarbij tick()
// iets laat wisselen en teruggeeft hoeveel ms tot de volgende beurt.
//
// Alleen de cellen op de eerste rij doen mee: het raster van de cellen
// (auto-fill) laat er bij een smallere pagina minder zien. Loopt alleen
// tussen resume() en pause(); dat regelt components/ticker.js.
//
// snapshot() geeft wat er op de rij staat; met keep: true begint de
// console niet leeg maar met wat er al in de cellen staat (de rij van de
// vorige pagina, partials/dock.njk).

const STEP = [55, 110]; // ms per stap van een wissel
const ROLL = [0, 3]; // tekens uit de rol vóór de klep
const FLAP = ['▀', '▄'];
const STAGGER = 60; // ms tussen twee cellen bij set() en een rijtje
const ERROR = 0.07; // kans per wissel op een foutteken
const ERROR_HOLD = [280, 900]; // ms dat de fout blijft staan
export const ERROR_GLYPHS = [...'▚▞▙▛¤×?!#≠'];
// Het ontstaan (intro()): de cursor knippert blink keer links, aan en uit
// elk blinkFor ms (per keer anders), dan rolt de regel uit, haperend:
//
//   chunk      zoveel cellen komen tegelijk binnen
//   every      ms tot het volgende brokje, keer een tempo uit tempo
//              ([factor, kans]: gewoon, een uitschieter, trager)
//   hang       kans per brokje dat hij even blijft haken, hangFor ms
//   back       kans per brokje dat een cel die al staat (een van de
//              laatste backFrom) terugvalt naar ░ en opnieuw uitrolt
//   stages     een cel loopt via ░ ▒ ▓ naar zwart, step ms per stap
//   error      zoveel cellen komen omgekeerd binnen ([data-ticker-error],
//              een foutteken), haperen halverwege (een ander foutteken of
//              ▓) en slaan dan met de klep (▀ ▄) naar zwart; errorHold ms
//
// Samen zo'n 1,6 s op 576 (36 cellen) en zo'n 2 s op de brede dock (56 cellen van 24).
const INTRO = {
	blink: 3,
	blinkFor: [80, 190],
	chunk: [1, 3],
	every: [8, 22],
	tempo: [[1, 0.55], [0.4, 0.25], [2.2, 0.2]],
	hang: 0.05,
	hangFor: [100, 260],
	back: 0.12,
	backFrom: 6,
	stages: [...'░▒▓ '],
	step: 14,
	error: 0.12,
	errorHold: [160, 380],
};

// Snel (fast, bij het ontcijferen van de console): kortere stappen, hooguit
// één teken uit de rol, en minder vaak een fout.
const FAST = { step: [25, 45], roll: [0, 1], error: 0.03 };

// De console: ms per teken, de stilte als een regel links staat, de kans
// per teken op een fout en op ruis (versleuteld binnen, NOISE; minder in
// een regel die voorbijloopt: die wordt niet ontcijferd), ms tussen
// twee cellen bij het ontcijferen, en de cursor.
export const CONSOLE = {
	type: [7, 15],
	stop: [300, 550],
	error: 0.012,
	noise: 0.14,
	passNoise: 0.05,
	// Een regel die voorbijloopt: trager, en in stukjes. Na ; en , even
	// stil, na ( en { korter, na een spatie soms.
	pass: [12, 22],
	chunk: { ';': [200, 340], ',': [100, 180], '(': [50, 110], '{': [50, 110], ' ': [40, 90] },
	chunkSpace: 0.25,
	// Het tempo: om de run tekens een ander, als factor op de ms per
	// teken, met een kans: gewoon, een uitschieter, trager, slepend.
	tempo: { run: [4, 24], kinds: [[1, 0.5], [0.35, 0.25], [2.4, 0.15], [5, 0.1]] },
	// Per teken de kans dat hij even blijft haken, en hoe lang.
	hang: 0.012,
	hangFor: [250, 1100],
	// De kans dat een regel langer stilstaat dan stop.
	stopLong: 0.2,
	stopLongFor: [900, 1800],
	// De stilte na een regel met brief.
	brief: [40, 120],
	// ms tussen twee cellen bij het ontcijferen, per keer anders.
	decode: [6, 30],
	// ms tussen twee wissels van de regel die staat (idle()).
	idle: [2000, 4000],
	// ms aan en uit van de cursor in de wachtstand.
	blink: 530,
	cursor: { typing: '▄', idle: '█' },
};
// De tekens van de cursor (CONSOLE.cursor), om een oude plek leeg te maken.
const CURSOR = [...'▄█'];
export const NOISE = [...'▓▒░0123456789ABCDEF#%&$*+=/<>'];

// Tekens die in JetBrains Mono staan, in kapitalen.
export const SETS = {
	bits: [...'01'],
	hex: [...'0123456789ABCDEF'],
	alnum: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'],
	code: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}()[]<>=;:/._+-*&|!?#$%'],
};

// Toeval.
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const between = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const chance = (p) => Math.random() < p;
// Een waarde uit [[waarde, kans], …].
const weighted = (list) => {
	let r = Math.random();
	for (const [value, p] of list) if ((r -= p) < 0) return value;
	return list[0][0];
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isDigit = (ch) => ch >= '0' && ch <= '9';

export const MODES = {
	random(ticker, set) {
		// Een ander teken dan wat er staat: met bits altijd de andere.
		const other = (cell) => pick(set.filter((ch) => ch !== cell.textContent));
		return {
			tick() {
				const cells = ticker.visible();
				if (!cells.length) return 1000;
				if (chance(0.2)) {
					const length = Math.min(cells.length, between(2, 6));
					const start = between(0, cells.length - length);
					cells.slice(start, start + length).forEach((cell, i) => {
						setTimeout(() => ticker.flip(cell, other(cell)), i * STAGGER);
					});
				} else {
					const cell = pick(cells);
					ticker.flip(cell, other(cell));
				}
				return between(400, 1600);
			},
		};
	},

	console(ticker) {
		// De regels die nog moeten komen ({ forms, last }), en de tekens
		// van de regel die binnenkomt (met de spaties tot hij links staat).
		const lines = [];
		let chars = [];
		let line = null;
		let settled = false;
		// Het tempo van nu en hoeveel tekens nog; de wachtstand (idle()) en
		// de wissel die loopt.
		let tempo = 1;
		let run = 0;
		let idle = null;
		let morphing = null;

		// Begint leeg, tenzij de rij van de vorige pagina er al staat
		// (keep, components/ticker.js): dan gaat hij daar verder.
		if (!ticker.keep) ticker.cells.forEach((cell) => (cell.textContent = ' '));
		ticker.cursor(CONSOLE.cursor.idle);
		// forms: de vormen, of een functie die ze geeft als de regel aan
		// de beurt is. at: wat er gebeurt als de regel links staat (mag een promise
		// geven: dan blijft hij staan tot die klaar is). Geeft een promise
		// die klaar is als de regel weer verder mag.
		// pass: de regel loopt voorbij, zonder te stoppen (twee spaties
		// erachter), zoals code die voorbijschiet.
		ticker.write = (forms, { at, enter, brief = false, pass = false, fast = false, warn = false } = {}) => {
			idle = null;
			return new Promise((done) => lines.push({ forms: [].concat(forms), at, enter, brief, pass, fast, warn, done, last: false }));
		};
		ticker.idle = (texts) => (idle = { texts, i: 0, at: null });
		ticker.end = (forms) => lines.push({ forms: [].concat(forms), last: true });
		// Pas als de eindtekst links staat: daarvoor schuift hij nog.
		const set = ticker.set;
		ticker.set = (text) => settled && set(text);
		// De regel die links staat bijwerken, zoals een teller (in at()):
		// de langste vorm die past, de cellen die anders zijn klappen om,
		// cijfer naar cijfer rustig. De cursor blijft.
		ticker.patch = (forms) => {
			const room = ticker.room();
			const text = [...[].concat(forms).find((form) => form.length <= room) ?? [].concat(forms).at(-1)].map((ch) => ch.toUpperCase());
			ticker.visible().slice(0, -1).forEach((cell, i) => {
				const ch = text[i] ?? ' ';
				const quiet = isDigit(ch) && isDigit(cell.textContent);
				cell.dataset.ch = ch;
				ticker.flip(cell, ch, { quiet });
			});
		};

		// De ms tot het volgende teken: het tempo wisselt om de run tekens,
		// en soms blijft hij haken (hang: de cursor staat dan stil).
		const pace = (ms) => {
			if (run-- <= 0) {
				tempo = weighted(CONSOLE.tempo.kinds);
				run = between(...CONSOLE.tempo.run);
			}
			if (chance(CONSOLE.hang)) return { ms: between(...CONSOLE.hangFor), hang: true };
			return { ms: Math.round(ms * tempo), hang: false };
		};

		// De wachtstand: de volgende tekst, de langste vorm die past, en of
		// het een melding is. Een functie die null geeft, wordt
		// overgeslagen.
		const next = () => {
			const texts = typeof idle.texts === 'function' ? idle.texts() : idle.texts;
			let text = null;
			while (!text) {
				idle.i = (idle.i + 1) % texts.length;
				text = texts[idle.i];
				if (typeof text === 'function') text = text();
			}
			const forms = [].concat(text.forms ?? text);
			const room = ticker.room();
			return { text: forms.find((form) => form.length <= room) ?? forms.at(-1), warn: !!text.warn, hold: text.hold };
		};

		return {
			tick() {
				if (settled) return 1000;
				if (ticker.booting) return 100;
				// Een nieuwe regel: de langste vorm die past (anders de
				// kortste), en spaties tot hij links staat (het teken komt
				// binnen op de een-na-laatste cel).
				if (!line) {
					// In de wachtstand knippert de cursor; de beurt valt op
					// de wissel van de cursor.
					const blink = () => {
						const on = Math.floor(Date.now() / CONSOLE.blink) % 2 === 0;
						ticker.cursor(on ? CONSOLE.cursor.idle : ' ');
						return CONSOLE.blink - (Date.now() % CONSOLE.blink);
					};
					if (morphing) return blink();
					line = lines.shift();
					if (!line) {
						if (!idle) {
							ticker.cursor(CONSOLE.cursor.idle);
							return 200;
						}
						idle.at ??= Date.now() + between(...CONSOLE.idle);
						if (Date.now() >= idle.at) {
							const { text, warn, hold } = next();
							morphing = ticker.morph(text, between(...CONSOLE.decode), { warn }).then(() => {
								morphing = null;
								if (idle) idle.at = Date.now() + (hold ?? between(...CONSOLE.idle));
							});
						}
						return blink();
					}
					const room = ticker.room();
					line.enter?.();
					if (typeof line.forms[0] === 'function') line.forms = [].concat(line.forms[0]());
					const text = (line.forms.find((form) => form.length <= room) ?? line.forms.at(-1)).toUpperCase();
					chars = line.pass ? [...text, ' ', ' '] : [...text, ...Array(Math.max(0, room - text.length)).fill(' ')];
					// De eindtekst mag tot de rand, ook de cel van de
					// cursor: dat laatste teken komt erop als hij stilstaat.
					if (line.last && text.length > room) line.tail = chars.splice(room).join('');
				}
				const ch = chars.shift();
				if (ch !== undefined) {
					// Soms komt een teken versleuteld binnen (ruis), of als
					// fout; het echte teken loopt mee en komt terug bij het
					// ontcijferen.
					let shown = ch;
					let error = false;
					if (ch !== ' ' && chance(CONSOLE.error)) [shown, error] = [pick(ERROR_GLYPHS), true];
					else if (ch !== ' ' && chance(line.pass ? CONSOLE.passNoise : CONSOLE.noise)) shown = pick(NOISE);
					ticker.shift(shown, error, ch, line.warn);
					const chunk = line.pass && !line.fast && CONSOLE.chunk[ch];
					if (chunk && (ch !== ' ' || chance(CONSOLE.chunkSpace))) {
						ticker.cursor(CONSOLE.cursor.idle);
						return between(...chunk);
					}
					const { ms, hang } = pace(between(...(line.pass && !line.fast ? CONSOLE.pass : CONSOLE.type)));
					ticker.cursor(hang ? CONSOLE.cursor.idle : CONSOLE.cursor.typing);
					return ms;
				}
				// Voorbij: meteen de volgende.
				if (line.pass) {
					line.done();
					line = null;
					return 0;
				}
				// De regel staat links: eerst ontcijferen, dan at() (zolang
				// die duurt), dan even stil, of voorgoed.
				const current = line;
				ticker.cursor(CONSOLE.cursor.idle);
				if (!current.started) {
					current.started = true;
					current.waiting = ticker
						.decode(between(...CONSOLE.decode))
						.then(() => current.at?.())
						.then(() => (current.waiting = null));
				}
				if (current.waiting) return 50;
				if (current.last) {
					settled = true;
					ticker.cursor(current.tail?.[0] ?? ' ');
					return 1000;
				}
				line = null;
				const pause = current.brief
					? between(...CONSOLE.brief)
					: chance(CONSOLE.stopLong)
						? between(...CONSOLE.stopLongFor)
						: between(...CONSOLE.stop);
				setTimeout(current.done, pause);
				return pause;
			},
		};
	},
};

export function createTicker(el, { mode = 'random', set = 'alnum', keep = false } = {}) {
	const cells = [...el.children];
	const chars = SETS[set] ?? SETS.alnum;
	const busy = new WeakSet();
	let running = false;
	let timer = 0;

	const show = (cell, ch) => {
		if (cell.textContent !== ch) cell.textContent = ch;
	};
	const mark = (cell, error) => cell.toggleAttribute('data-ticker-error', error);
	const alert = (cell, warn) => cell.toggleAttribute('data-ticker-warn', warn);

	// Eén cel naar een ander teken. Loopt er al een wissel op de cel, dan
	// wordt deze overgeslagen.
	async function flip(cell, target, { quiet = false, fast = false } = {}) {
		if (busy.has(cell) || cell.textContent === target) return;
		busy.add(cell);
		const step = between(...(fast ? FAST.step : STEP));
		for (let i = quiet ? 0 : between(...(fast ? FAST.roll : ROLL)); i > 0; i--) {
			show(cell, pick(chars));
			await wait(step);
		}
		if (!quiet && chance(fast ? FAST.error : ERROR)) {
			const before = cell.textContent;
			mark(cell, true);
			show(cell, pick(ERROR_GLYPHS));
			await wait(between(...ERROR_HOLD) / 2);
			// Even hapert hij: een ander foutteken, of weer het oude.
			show(cell, chance(0.5) ? pick(ERROR_GLYPHS) : before);
			await wait(between(...ERROR_HOLD) / 2);
			mark(cell, false);
		}
		for (const flap of FLAP) {
			show(cell, flap);
			await wait(step);
		}
		show(cell, target);
		busy.delete(cell);
	}

	// De cellen op de eerste rij.
	const visible = () => {
		const top = cells[0]?.offsetTop;
		return cells.filter((cell) => cell.offsetTop === top);
	};

	// De band: alles een cel naar links (de fout loopt mee), het nieuwe
	// teken op de een-na-laatste cel; de laatste is de cursor.
	let row = [];
	// real: het echte teken als er iets anders staat (ruis, een fout); het
	// loopt mee in data-ch, voor decode(). warn: het teken hoort bij een
	// melding (rood); dat loopt ook mee.
	const shift = (ch, error = false, real = ch, warn = false) => {
		row = visible();
		const end = row.length - 1;
		for (let i = 0; i < end - 1; i++) {
			show(row[i], row[i + 1].textContent);
			mark(row[i], row[i + 1].hasAttribute('data-ticker-error'));
			alert(row[i], row[i + 1].hasAttribute('data-ticker-warn'));
			row[i].dataset.ch = row[i + 1].dataset.ch ?? row[i + 1].textContent;
		}
		if (end > 0) {
			show(row[end - 1], ch);
			mark(row[end - 1], error);
			alert(row[end - 1], warn);
			row[end - 1].dataset.ch = real;
		}
	};
	// Ontcijferen: elke cel waar iets anders staat dan het echte teken
	// klapt ernaar, van links, every ms na elkaar. Klaar als alle cellen
	// klaar zijn.
	const decode = (every) =>
		Promise.all(
			visible()
				.filter((cell) => cell.dataset.ch !== undefined && cell.textContent !== cell.dataset.ch)
				.map((cell, i) =>
					wait(i * every).then(() => {
						mark(cell, false);
						return flip(cell, cell.dataset.ch, { fast: true });
					}),
				),
		);
	// Een andere tekst op de rij (zonder de cursor), via ruis: de cellen
	// versleutelen van links, every ms na elkaar, dan even niets, dan
	// ontcijferen ze naar text; met warn als melding (rood).
	const morph = async (text, every, { warn = false } = {}) => {
		const list = visible().slice(0, -1);
		const target = [...text.toUpperCase()];
		await Promise.all(
			list.map((cell, i) =>
				wait(i * every).then(() => {
					const ch = target[i] ?? ' ';
					cell.dataset.ch = ch;
					alert(cell, warn);
					if (cell.textContent !== ' ' || ch !== ' ') show(cell, pick(NOISE));
				}),
			),
		);
		await wait(between(80, 300));
		return decode(every);
	};

	// De cursor op de laatste cel die nu te zien is, niet die van de laatste
	// shift: bij een andere breedte (de dock vanaf xl groeit in stappen)
	// staat hij dan meteen weer rechts. De oude plek wordt leeg.
	let cursorCell = null;
	const cursor = (ch) => {
		const last = visible().at(-1);
		if (cursorCell && cursorCell !== last && CURSOR.includes(cursorCell.textContent)) show(cursorCell, ' ');
		cursorCell = last;
		if (last) show(last, ch);
	};

	// Hoeveel tekens er op de rij passen naast de cursor, en zonder.
	const room = () => Math.max(0, visible().length - 1);
	const width = () => visible().length;

	// De cellen die anders zijn, van links, de rest van de rij leeg;
	// cijfer naar cijfer rustig.
	const setText = (text) => {
		const target = [...text.toUpperCase()];
		let n = 0;
		visible().forEach((cell, i) => {
			const ch = target[i] ?? ' ';
			if (cell.textContent === ch) return;
			const quiet = isDigit(ch) && isDigit(cell.textContent);
			setTimeout(() => flip(cell, ch, { quiet }), n++ * STAGGER);
		});
	};

	// Het ontstaan, als een terminal: zolang (data-ticker-boot) is een cel
	// pas te zien met data-on (css/components/ticker.css; in de dock al
	// vóór de JS, css/components/dock.css). Een modus slaat zolang z'n
	// beurten over (booting).
	const intro = async () => {
		const list = visible();
		const first = list[0];
		if (!first) return;
		ticker.booting = true;
		el.setAttribute('data-ticker-boot', '');
		cells.forEach((cell) => cell.removeAttribute('data-on'));
		first.setAttribute('data-on', '');
		for (let i = 0; i < INTRO.blink; i++) {
			show(first, '█');
			await wait(between(...INTRO.blinkFor));
			show(first, ' ');
			await wait(between(...INTRO.blinkFor));
		}

		// Een foutcel: omgekeerd binnen, hapert, dan de klep naar zwart.
		const broken = async (cell) => {
			const hold = between(...INTRO.errorHold);
			mark(cell, true);
			show(cell, pick(ERROR_GLYPHS));
			await wait(hold / 2);
			show(cell, chance(0.5) ? pick(ERROR_GLYPHS) : '▓');
			await wait(hold / 2);
			mark(cell, false);
			for (const flap of FLAP) {
				show(cell, flap);
				await wait(INTRO.step * 2);
			}
			show(cell, ' ');
		};

		// Per cel de stap in stages (-1: nog niet binnen; een foutcel loopt
		// los, in errors). Elke tik (step ms) gaat elke cel een stap verder;
		// het volgende brokje komt als next op is.
		const { stages } = INTRO;
		const stage = list.map(() => -1);
		const errors = [];
		let front = 0;
		let next = 0;
		while (front < list.length || stage.some((s) => s >= 0 && s < stages.length - 1)) {
			stage.forEach((s, i) => {
				if (s < 0 || s >= stages.length - 1) return;
				stage[i] = s + 1;
				show(list[i], stages[s + 1]);
			});
			if (front < list.length && (next -= INTRO.step) <= 0) {
				for (let n = between(...INTRO.chunk); n > 0 && front < list.length; n--, front++) {
					const cell = list[front];
					cell.setAttribute('data-on', '');
					if (front > 0 && chance(INTRO.error)) {
						stage[front] = stages.length;
						errors.push(broken(cell));
					} else {
						stage[front] = 0;
						show(cell, stages[0]);
					}
				}
				if (chance(INTRO.back)) {
					const i = between(Math.max(0, front - INTRO.backFrom), front - 1);
					if (stage[i] === stages.length - 1) {
						stage[i] = 0;
						show(list[i], stages[0]);
					}
				}
				next = between(...INTRO.every) * weighted(INTRO.tempo);
				if (chance(INTRO.hang)) next += between(...INTRO.hangFor);
			}
			await wait(INTRO.step);
		}
		await Promise.all(errors);
		cells.forEach((cell) => cell.setAttribute('data-on', ''));
		el.removeAttribute('data-ticker-boot');
		ticker.booting = false;
	};

	// Wat er nu op de rij staat: per cel het teken en of het een melding is.
	const snapshot = () => visible().map((cell) => [cell.textContent, cell.hasAttribute('data-ticker-warn') ? 1 : 0]);

	const ticker = { el, cells, keep, flip, visible, room, width, shift, decode, morph, cursor, intro, snapshot, set: setText };
	const driver = MODES[mode]?.(ticker, chars);

	const loop = () => {
		if (!running || !driver) return;
		timer = setTimeout(loop, driver.tick());
	};

	ticker.resume = () => {
		if (running) return;
		running = true;
		timer = setTimeout(loop, between(200, 800));
	};
	ticker.pause = () => {
		running = false;
		clearTimeout(timer);
	};
	return ticker;
}
