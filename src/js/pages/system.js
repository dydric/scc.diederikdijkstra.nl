// Bestand: js/pages/system.js
//
// Het design system (src/system/), aangemeld in layouts/system.njk.
// Fontvoorbeelden tonen de gemeten grootte, regelhoogte en tracking;
// kleurvlakken krijgen hun berekende kleur in de hovertekst.
// Opnieuw meten bij resize, ook bij browserzoom. De kopieerknoppen
// staan in components/copy.js.

const round = (value) => Math.round(value * 100) / 100;

const measure = (target) => {
	const style = getComputedStyle(target);
	const size = parseFloat(style.fontSize);
	const lineHeight = parseFloat(style.lineHeight);
	const tracking = style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing);
	return { size, lineHeight, tracking };
};

const update = () => {
	// De browser rekent de lokale kleur van elke modus om naar een concrete
	// CSS-kleur. De native hovertekst toont die zonder extra ruimte in de rij.
	document.querySelectorAll('[data-color-token]').forEach((swatch) => {
		const probe = document.createElement('span');
		probe.style.cssText = 'position:absolute;visibility:hidden;color:var(--swatch-color)';
		swatch.append(probe);
		const color = getComputedStyle(probe).color;
		probe.remove();
		const info = `${swatch.dataset.colorToken} · ${swatch.dataset.colorMode}: ${color}`;
		swatch.title = info;
		swatch.setAttribute('aria-label', info);
	});

	document.querySelectorAll('[data-type-sample]').forEach((sample) => {
		const target = sample.querySelector('[data-type-target]');
		if (!target) return;
		const values = measure(target);
		const spec = sample.querySelector('[data-type-spec]');
		if (spec) {
			spec.textContent = `${round(values.size)}px / ${round(values.lineHeight)}px · tracking ${round(values.tracking)}px`;
		}
	});
};

const init = () => {
	// Pas meten als de fonts er zijn: tot dan staat de fallback er.
	document.fonts.ready.then(update);
	let frame = 0;
	window.addEventListener('resize', () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(update);
	});
};

init();
