// Bestand: js/components/copy.js
//
// Kopieerknoppen ([data-copy]): kopiëren de tekst van [data-copy-source] in
// hetzelfde blok, zonder wat daarin [data-copy-skip] heeft (het commentaar
// achter //, dat in Nunjucks niet bestaat). Aangemeld door de snippet in partials/system/usage.njk. In
// de bron hidden: zonder JavaScript of zonder klembord valt er niets te
// kopiëren.

// De tekst zonder het overgeslagen deel, en zonder de spaties die ervoor
// stonden.
const text = (source) => {
	const copy = source.cloneNode(true);
	copy.querySelectorAll('[data-copy-skip]').forEach((el) => el.remove());
	return copy.textContent.replace(/[ \t]+$/gm, '');
};

const init = () => {
	if (!navigator.clipboard) return;
	document.querySelectorAll('[data-copy]').forEach((button) => {
		const source = button.parentElement.querySelector('[data-copy-source]');
		if (!source) return;
		// De knop zegt wat er gebeurd is: COPY, COPIED, of FAILED als het
		// niet lukte; na 1,5 s weer COPY.
		const show = (label) => (button.textContent = label);
		button.hidden = false;
		let timer = 0;
		button.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(text(source));
				show('Copied');
			} catch {
				show('Failed');
			}
			clearTimeout(timer);
			timer = setTimeout(() => show('Copy'), 1500);
		});
	});
};

init();
