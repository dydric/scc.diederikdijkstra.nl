// Bestand: js/modules/scc/turf.js
//
// Het voetbalveld achter de homehero en het wedstrijdbord
// (css/components/scc-turf.css). Eén gedeelde, procedurele grastekstuur;
// per paneel een WebGL-canvas met maaibanen, belijning en licht.
//
//   turf(panels)   start het veld op [data-turf]-panelen en geeft een
//                   besturing terug: update(panel) na een nieuwe aftraptijd
//                   of nieuwe namen; setEnabled, setLights, setMoment en
//                   replay voor de vergelijking op /system/grass/; ready
//                   wacht tot de WebGL-velden er zijn.
//
// Met data-turf-view="half" tekent hetzelfde veld een staande speelhelft
// voor de opstelling (css/components/scc-ui.css, .scc-pitch-ground): het
// eigen doel onder, de middellijn met de halve middencirkel boven. De
// lampen hangen dan achter de bovenrand; maten komen uit de lay-out.
//
// Een aftrap om 18:00 of later (Nederlandse tijd) is een avondwedstrijd met
// stadionlicht vanachter de timeline; eerder valt de schaduw van de tribune
// over het veld. Er tekent alleen iets bij verandering; de enige renderlus
// is de eenmalige lichtopkomst. Zonder WebGL zet data-turf-static de SVG uit
// de CSS eronder.

const LAMPS = 9;
const EVENING = 18;
const kickoffHour = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', hour: 'numeric', hourCycle: 'h23' });

function grassTexture() {
	const image = document.createElement('canvas');
	const edge = 2048;
	image.width = image.height = edge;
	const ctx = image.getContext('2d');
	let seed = 2026;
	const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
	// Fijne ondergroei voorkomt een vlakke kleur tussen de afzonderlijke sprieten.
	const pixels = ctx.createImageData(edge, edge);
	for (let i = 0; i < pixels.data.length; i += 4) {
		const grain = random() * 24;
		pixels.data[i] = 40 + grain;
		pixels.data[i + 1] = 66 + grain;
		pixels.data[i + 2] = 30 + grain * .6;
		pixels.data[i + 3] = 255;
	}
	ctx.putImageData(pixels, 0, 0);
	const colors = ['#263e24', '#3a542e', '#526b39', '#647b45', '#74864e', '#304b28'];
	for (let i = 0; i < 300000; i++) {
		const x = random() * edge;
		const y = random() * edge;
		const length = 2 + random() * 7;
		const bend = random() * 5 - 2.5;
		ctx.strokeStyle = colors[Math.floor(random() * colors.length)];
		ctx.lineWidth = .6 + random() * 1.2;
		// Sprieten over de rand doorzetten maakt de textuur naadloos herhaalbaar.
		for (const dx of x < 3 ? [0, edge] : x > edge - 3 ? [0, -edge] : [0]) {
			for (const dy of y < 9 ? [0, edge] : [0]) {
				ctx.beginPath();
				ctx.moveTo(x + dx, y + dy);
				ctx.quadraticCurveTo(x + dx + bend, y + dy - length * .45, x + dx + bend * .65, y + dy - length);
				ctx.stroke();
			}
		}
	}
	return image;
}

// De middenstip volgt het midden van de clubnamen op home, ook bij stapeling.
// Ook na verschuiven blijft de uitsnede binnen de uitloop van het veld.
function fieldFrame(panel) {
	const rect = panel.getBoundingClientRect();
	const names = [...panel.querySelectorAll('.scc-upcoming-name')];
	const center = names.length ? names.reduce((sum, name) => {
		const box = name.getBoundingClientRect();
		return sum + box.top + box.height / 2 - rect.top;
	}, 0) / names.length / rect.height : .5;
	const width = Math.min(112, 37.5 / Math.max(center, 1 - center) * rect.width / rect.height);
	const imageHeight = rect.width * 75 / width;
	panel.style.setProperty('--turf-size', `${rect.width * 112 / width}px ${imageHeight}px`);
	panel.style.setProperty('--turf-y', `${center * rect.height - imageHeight / 2}px`);
	return { center, width };
}

// Een staande speelhelft: 73 meter breed (68 plus uitloop), het doel met
// 2,5 meter uitloop onderaan; de hoogte volgt de verhouding van het paneel.
export const HALF = { across: 73, goal: 55 };

// Van schermcoördinaten (uv, 0 tot 1, onder 0) naar veldmeters: p = basis · uv + oorsprong.
function fieldMap(panel, rect) {
	if (panel.dataset.turfView === 'half') {
		const depth = HALF.across * rect.height / rect.width;
		return { basis: [0, HALF.across, -depth, 0], origin: [HALF.goal, -HALF.across / 2] };
	}
	const { center, width } = fieldFrame(panel);
	const height = width * rect.height / rect.width;
	return { basis: [width, 0, 0, height], origin: [-width / 2, -(1 - center) * height] };
}

// Een speelhelft meet met de lay-outmaat (ongevoelig voor transforms).
function measure(panel) {
	if (panel.dataset.turfView !== 'half') return panel.getBoundingClientRect();
	return { width: panel.offsetWidth, height: panel.offsetHeight, top: 0 };
}

const vertex = `attribute vec2 position;
varying vec2 uv;
void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }`;
const fragment = `precision highp float;
varying vec2 uv;
uniform sampler2D grass;
uniform vec2 size;
uniform mat2 basis;
uniform vec2 origin;
uniform float bar;
uniform float day;
uniform float lamps[${LAMPS}];
uniform vec3 sun;
float stroke(float d, float width) { return 1. - smoothstep(width, width + .10, abs(d)); }
float box(vec2 p, vec2 b) { vec2 q = abs(p)-b; return length(max(q,0.)) + min(max(q.x,q.y),0.); }
float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
	// Veld in meters: 105 bij 68, met een smalle uitloop. Op mobiel uitsnede;
	// bij de opstelling een staande helft.
	vec2 p = basis * uv + origin;
	vec3 tex = texture2D(grass, p / 29.).rgb;
	// Een tweede schaal breekt herkenbare herhaling zonder extra textuurbestand.
	tex *= .88 + texture2D(grass, vec2(-p.y, p.x) / 17. + .37).g * .28;
	vec2 end = vec2(abs(p.x), p.y);
	// Slijtage in de doelmonden en rond de middenstip, grillig door de textuur.
	float wear = exp(-dot((end - vec2(49.5, 0.)) * vec2(.42, .2), (end - vec2(49.5, 0.)) * vec2(.42, .2))) * .8
		+ exp(-dot(p * vec2(.25, .3), p * vec2(.25, .3))) * .35
		+ exp(-dot(end - vec2(41.5, 0.), end - vec2(41.5, 0.)) * .5) * .4;
	wear *= clamp(.35 + (texture2D(grass, p / 6.3 + .21).g - .28) * 5., 0., 1.);
	vec3 color = tex * .78;
	color = mix(color, vec3(.33, .31, .21) * (.75 + tex.r * 1.1), clamp(wear, 0., 1.) * .5);
	float lines = stroke(box(p, vec2(52.5,34.)), .065);
	lines = max(lines, stroke(p.x,.065) * (1. - step(34.,abs(p.y))));
	lines = max(lines, stroke(length(p)-9.15,.065));
	lines = max(lines, stroke(box(end-vec2(44.25,0.),vec2(8.25,20.16)),.065));
	lines = max(lines, stroke(box(end-vec2(49.75,0.),vec2(2.75,9.16)),.065));
	lines = max(lines, stroke(length(end-vec2(41.5,0.))-9.15,.065) * (1.-step(36.,end.x)));
	lines = max(lines, 1.-smoothstep(.10,.25,length(p)));
	lines = max(lines, 1.-smoothstep(.10,.25,length(end-vec2(41.5,0.))));
	// De kalk neemt de onregelmatigheid van de sprieten over.
	color = mix(color, vec3(.65,.73,.55), lines * (.25 + tex.g*.30));

	// Maaibanen: de sprieten liggen per baan naar boven of naar onder.
	float lean = mod(floor((p.x + 52.5) / 8.75), 2.) * 2. - 1.;
	float stripes = 1. - clamp(wear, 0., 1.) * .7;
	vec2 P = vec2(uv.x, 1. - uv.y) * size;
	float spacing = size.x / ${LAMPS}.;

	if (day < .5) {
		// Avond: een rij lampen achter de timeline, hoog boven het veld.
		float H = clamp(size.y * .3, 110., 190.);
		float s = P.y - bar;
		float beam = 5. + s * .12;
		float E = 0., sheen = 0., haze = 0., leak = 0.;
		for (int i = 0; i < ${LAMPS}; i++) {
			vec2 L = vec2((float(i) + .5) * spacing, bar - 4.);
			vec2 d = L - P;
			float r2 = dot(d, d);
			float e = H * H * H / pow(r2 + H * H, 1.5) * lamps[i];
			E += e;
			// Scheerlicht laat de banen het sterkst zien; recht eronder vlakt het af.
			sheen += e * (-d.y / sqrt(r2 + H * H));
			// Bundels waaieren licht naar buiten uit en kruisen elkaar nooit.
			float u = P.x - L.x - (L.x / size.x - .5) * .4 * max(s, 0.);
			haze += exp(-u * u / (beam * beam)) * lamps[i];
			leak += exp(-d.x * d.x / 196.) * lamps[i];
		}
		// Lampdichtheid normaliseren: elke breedte krijgt hetzelfde lichtniveau.
		E *= spacing / (2. * H);
		sheen *= spacing / (2. * H);
		haze *= spacing / (spacing + beam * 1.77) * exp(-max(s, 0.) / (H * 2.4)) * smoothstep(0., 24., s);
		float on = 0.;
		for (int i = 0; i < ${LAMPS}; i++) on += lamps[i];
		on /= ${LAMPS}.;
		color *= 1. + lean * (.04 + sheen * .5) * stripes;
		color *= vec3(.62, .65, .64) + E * vec3(1.0, .96, .87);
		color += vec3(.95, .9, .78) * (haze * .1 + exp(-max(s, 0.) / 4.) * (.06 * on + leak * .1) * step(0., s));
	} else {
		// Middag: zon achter de tribune boven; de schaduw valt over het bovenste deel.
		float roof = sin(P.x / size.x * 12.566 + 1.3) * 5. + sin(P.x / size.x * 31.4) * 2.;
		float lit = smoothstep(sun.z - 28., sun.z + 28., P.y - bar + roof);
		color *= 1. + lean * (.05 + .1 * abs(sun.y)) * stripes * mix(.4, 1., lit);
		color *= mix(vec3(.82, .90, 1.02), vec3(1.62, 1.52, 1.22), lit);
	}
	// Ruis van een halve kleurstap voorkomt banding in de donkere verlopen.
	color += (hash(gl_FragCoord.xy) - .5) / 255.;
	gl_FragColor = vec4(color,1.);
}`;

// Dezelfde curve als de eerdere CSS-opkomst: cubic-bezier(.22,.61,.36,1).
function bezier(x1, y1, x2, y2) {
	const at = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
	return x => {
		let low = 0, high = 1;
		for (let i = 0; i < 20; i++) {
			const middle = (low + high) / 2;
			if (at(x1, x2, middle) < x) low = middle; else high = middle;
		}
		return at(y1, y2, (low + high) / 2);
	};
}
const ease = bezier(.22, .61, .36, 1);

export function turf(panels) {
	panels = [...panels];
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
	let enabled = true, lightsEnabled = true, moment = 'auto';
	const lighting = new Map(panels.map(panel => [panel, { auto: 'avond', mode: 'avond', lamps: new Float32Array(LAMPS).fill(1) }]));
	const renderers = new Map();
	const redraw = panel => renderers.get(panel)?.request();

	// Zonder aftraptijd blijft het veld verlicht.
	function applyMoment(panel) {
		const state = lighting.get(panel);
		const kickoff = new Date(panel.dataset.kickoff);
		state.auto = isNaN(kickoff) || Number(kickoffHour.format(kickoff)) >= EVENING ? 'avond' : 'middag';
		state.mode = moment === 'auto' ? state.auto : moment;
		panel.dataset.light = state.mode;
	}

	function renderer(panel, textureImage) {
		const canvas = document.createElement('canvas');
		canvas.className = 'scc-turf-canvas';
		canvas.setAttribute('aria-hidden', 'true');
		const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
		if (!gl) return null;
		const resources = [];
		let program, buffer, texture;
		try {
			program = gl.createProgram();
			for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
				const shader = gl.createShader(type);
				resources.push(shader);
				gl.shaderSource(shader, source);
				gl.compileShader(shader);
				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Gras-shader niet beschikbaar');
				gl.attachShader(program, shader);
			}
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Gras-programma niet beschikbaar');
			gl.useProgram(program);
			buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
			const position = gl.getAttribLocation(program, 'position');
			gl.enableVertexAttribArray(position);
			gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
			texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage);
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		} catch {
			resources.forEach(shader => gl.deleteShader(shader));
			if (texture) gl.deleteTexture(texture);
			if (buffer) gl.deleteBuffer(buffer);
			if (program) gl.deleteProgram(program);
			return null;
		}
		resources.forEach(shader => gl.deleteShader(shader));
		panel.prepend(canvas);
		const uniform = name => gl.getUniformLocation(program, name);
		const size = uniform('size'), basis = uniform('basis'), origin = uniform('origin'), bar = uniform('bar');
		const day = uniform('day'), lamps = uniform('lamps'), sun = uniform('sun');
		let frame = 0, visible = false, lost = false;
		function draw() {
			frame = 0;
			if (lost || !visible || document.hidden || !enabled) return;
			const rect = measure(panel);
			const placement = fieldMap(panel, rect);
			const state = lighting.get(panel);
			// De lampen hangen achter de onderrand van de timeline (bij een
			// speelhelft achter de bovenrand).
			const band = panel.querySelector('.scc-strip-band, .scc-preview-bar');
			gl.uniform1f(bar, band?.getClientRects().length ? band.getBoundingClientRect().bottom - rect.top : 0);
			gl.uniformMatrix2fv(basis, false, placement.basis);
			gl.uniform2fv(origin, placement.origin);
			gl.uniform1fv(lamps, state.lamps);
			gl.uniform1f(day, state.mode === 'middag' ? 1 : 0);
			// Middag: de tribuneschaduw reikt veertien meter het veld in.
			if (state.mode === 'middag') gl.uniform3f(sun, .45, .9, 14 * rect.height / Math.hypot(placement.basis[2], placement.basis[3]));
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			canvas.dataset.ready = '';
		}
		function request() { if (!frame && !lost) frame = requestAnimationFrame(draw); }
		new ResizeObserver(() => {
			const rect = measure(panel);
			const scale = Math.min(devicePixelRatio || 1, 2, 2560 / rect.width, 4096 / rect.height);
			canvas.width = Math.max(1, Math.round(rect.width * scale));
			canvas.height = Math.max(1, Math.round(rect.height * scale));
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.uniform2f(size, rect.width, rect.height);
			request();
		}).observe(panel);
		new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; request(); }).observe(panel);
		document.addEventListener('visibilitychange', request);
		canvas.addEventListener('webglcontextlost', () => {
			lost = true;
			cancelAnimationFrame(frame);
			canvas.remove();
			panel.setAttribute('data-turf-static', '');
		});
		return { request, available: () => !lost };
	}

	// De reserve-SVG volgt dezelfde uitsnede, ook na resize en geladen fonts.
	const framed = panels.filter(panel => panel.dataset.turfView !== 'half');
	const fieldObserver = new ResizeObserver(entries => entries.forEach(({ target }) => fieldFrame(target)));
	panels.forEach(applyMoment);
	framed.forEach(panel => fieldObserver.observe(panel));

	// De textuur kost even rekenwerk; eerst de pagina, dan het gras.
	const idle = window.requestIdleCallback ?? (callback => setTimeout(callback, 1));
	const ready = new Promise(resolve => idle(() => {
		const texture = grassTexture();
		for (const panel of panels) {
			const item = renderer(panel, texture);
			if (item) renderers.set(panel, item);
			else panel.setAttribute('data-turf-static', '');
		}
		document.fonts.ready.then(() => panels.forEach(redraw));
		resolve();
	}, { timeout: 800 }));
	document.fonts.ready.then(() => framed.forEach(fieldFrame));

	// Eenmalige lichtopkomst per paneel per tabsessie: 2200ms, maximaal 400ms
	// spreiding, van het midden naar buiten. Gras en tekst blijven stil.
	const lightKey = panel => `scc-turf-light-v1:${panel.dataset.turf}`;
	const seenLight = panel => {
		try { return sessionStorage.getItem(lightKey(panel)) === 'seen'; } catch { return false; }
	};
	const rememberLight = panel => {
		try { sessionStorage.setItem(lightKey(panel), 'seen'); } catch { /* Zonder opslag eenmaal per paginalading. */ }
	};
	const setLamps = (panel, value) => {
		lighting.get(panel).lamps.fill(value);
		redraw(panel);
	};
	function playLights(panel) {
		const { lamps } = lighting.get(panel);
		const start = performance.now();
		const middle = (LAMPS - 1) / 2;
		panel.dataset.lightIntro = 'playing';
		const step = now => {
			let done = true;
			for (let i = 0; i < LAMPS; i++) {
				const t = Math.min(1, Math.max(0, (now - start - Math.abs(i - middle) / middle * 400) / 2200));
				lamps[i] = ease(t);
				if (t < 1) done = false;
			}
			redraw(panel);
			if (done || panel.dataset.lightIntro !== 'playing') {
				if (panel.dataset.lightIntro === 'playing') panel.removeAttribute('data-light-intro');
			} else requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}
	const lightObserver = new IntersectionObserver(entries => {
		for (const { target: panel, isIntersecting } of entries) {
			if (!isIntersecting || !enabled || !lightsEnabled || panel.dataset.lightIntro !== 'pending') continue;
			if (reducedMotion.matches) {
				panel.removeAttribute('data-light-intro');
				setLamps(panel, 1);
			} else playLights(panel);
			rememberLight(panel);
			lightObserver.unobserve(panel);
		}
	}, { threshold: 0 });
	function queueLights(panel) {
		panel.dataset.lightIntro = 'pending';
		setLamps(panel, 0);
		lightObserver.unobserve(panel);
		lightObserver.observe(panel);
	}
	function observePendingLights() {
		for (const panel of panels) if (panel.dataset.lightIntro === 'pending') {
			lightObserver.unobserve(panel);
			lightObserver.observe(panel);
		}
	}
	for (const panel of panels) if (!seenLight(panel) && !reducedMotion.matches) queueLights(panel);
	reducedMotion.addEventListener('change', () => {
		if (reducedMotion.matches) panels.forEach(panel => {
			panel.removeAttribute('data-light-intro');
			lightObserver.unobserve(panel);
			if (lightsEnabled) setLamps(panel, 1);
		});
	});

	return {
		panels,
		ready,
		// Na een nieuwe aftraptijd of nieuwe clubnamen.
		update(panel) {
			applyMoment(panel);
			if (panel.dataset.turfView !== 'half') fieldFrame(panel);
			redraw(panel);
		},
		setEnabled(value) {
			enabled = value;
			panels.forEach(redraw);
			observePendingLights();
		},
		setLights(value) {
			lightsEnabled = value;
			panels.forEach(panel => {
				panel.toggleAttribute('data-lights-off', !value);
				if (panel.dataset.lightIntro === 'playing') panel.removeAttribute('data-light-intro');
				if (panel.dataset.lightIntro !== 'pending') setLamps(panel, value ? 1 : 0);
			});
			observePendingLights();
		},
		setMoment(value) {
			moment = value;
			panels.forEach(panel => { applyMoment(panel); redraw(panel); });
		},
		replay() { panels.forEach(queueLights); },
		modes: () => panels.map(panel => lighting.get(panel).mode),
		webgl: () => [...renderers.values()].filter(item => item.available()).length,
	};
}
