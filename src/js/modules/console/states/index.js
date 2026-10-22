// Bestand: js/modules/console/states/index.js
//
// De states van de console: wat een pagina na het opstartlog (of de
// wissel) op de console zet. De naam staat in de front matter (console:
// await op home en error op de 404), de dock geeft hem door als
// data-ticker-state; zonder: DEFAULT.
// Een nieuwe state: een module hier met { prepare?, lead?, run }, en hier
// aanmelden. Het contract en een recept: docs/componenten/dock.md.

import waiting from './await.js';
import error from './error.js';
import live from './live.js';

export const DEFAULT = 'live';

export const STATES = { live, await: waiting, error };
