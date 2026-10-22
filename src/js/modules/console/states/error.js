// Bestand: js/modules/console/states/error.js
//
// State error (console: error, op de 404). Na het opstartlog (of de
// wissel) meldt lead() dat de pagina er niet is, met het pad als dat
// past. Daarna wisselt idle() de melding met READY. Smaller dan MIN
// (lines.js) komen de breedtemeldingen.

import { setTab } from '../../site/tab.js';
import { READY, WARN, narrow } from '../lines.js';

const path = location.pathname.toUpperCase();
const NOT_FOUND = [`× 404 · PAGE NOT FOUND · ${path}`, '× 404 · PAGE NOT FOUND', '× 404 PAGE NOT FOUND', '× 404 NOT FOUND'];

export default {
	lead(ticker) {
		setTab('× 404');
		return ticker.write(NOT_FOUND, { warn: true });
	},

	run(ticker, { ready }) {
		ready();
		const normal = [{ forms: NOT_FOUND, warn: true }, READY];
		ticker.idle(() => (narrow() ? WARN : normal));
	},
};
