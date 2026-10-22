// Bestand: js/core.js
//
// Altijd geladen: raster en tabtitel.

import { initGrid } from './modules/site/grid.js';
import { initTab } from './modules/site/tab.js';

document.documentElement.classList.add('js');

// Het raster, alleen op pagina's met .grid-probe (base/grid.css).
initGrid();

// De titel in de tab: de naam, en soms een melding (modules/site/tab.js).
initTab();
