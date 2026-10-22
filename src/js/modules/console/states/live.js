// Bestand: js/modules/console/states/live.js
//
// State live: na LOAD of GOTO toont de dock de vorige pagina en daarna
// de klok met de plaats. De pagina komt vrij zodra de state begint.

import { onTick } from '../../data/time.js';
import { WARN, clickOf, leftOf, narrow, now } from '../lines.js';
import { previous, session } from '../visitor.js';

export default {
	run(ticker, { places, ready, first }) {
		ready();
		if (!first) {
			const visit = previous();
			for (const line of [clickOf(visit), leftOf(visit, session()?.n)]) if (line) ticker.write(line);
		}
		if (narrow()) {
			ticker.write(WARN[0]().forms, { warn: true });
			ticker.idle(WARN);
			return;
		}
		ticker.end(() => now(places, ticker.width()));
		onTick(() => ticker.set(now(places, ticker.width())));
	},
};
