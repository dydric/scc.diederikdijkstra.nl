// Bestand: js/modules/console/states/await.js
//
// De wachtstand op het SCC-overzicht: na LOAD of GOTO meldt de console
// dat hij klaar is. Daarna wisselen klok, duur, hover en sessie. Onder
// 300px komen de blijvende breedtemeldingen.

import { setTab } from '../../site/tab.js';
import { READY, LISTEN, WARN, clock, hoverOf, idleFor, narrow, sessionOf } from '../lines.js';
import { hovered, session } from '../visitor.js';

// De tab laat de wachtstand alleen zien zolang hij verborgen is.
function tabAwait() {
	const sync = () => setTab(document.hidden ? 'Awaiting input' : null);
	document.addEventListener('visibilitychange', sync);
	sync();
}

export default {
	run(ticker, { ready }) {
		let since = Date.now();
		if (narrow()) ticker.write(WARN[0]().forms, { warn: true, at: () => (ready(), tabAwait()) });
		else ticker.write(READY, { at: () => ((since = Date.now()), ready(), tabAwait()) });

		const normal = [READY, clock, idleFor(() => since), hoverOf(hovered), sessionOf(session), LISTEN];
		ticker.idle(() => (narrow() ? WARN : normal));
	},
};
