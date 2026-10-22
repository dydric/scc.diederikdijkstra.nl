// Lokale vergelijking van het voetbalveld (js/modules/scc/turf.js), dat home
// en de wedstrijdpagina's ook gebruiken. Hier alleen de knoppen eromheen.
import { turf } from '../modules/scc/turf.js';

const field = turf(document.querySelectorAll('[data-turf]'));
const { panels } = field;
let enabled = true;
let lightsEnabled = true;

document.querySelector('.grass-controls').hidden = false;
function updateStatus() {
  const count = field.webgl();
  document.querySelector('[data-grass-status]').textContent = !enabled ? 'Ontwerp zonder veld' :
    `${count === panels.length ? 'WebGL-veld' : 'Statisch reserveveld'} · ${field.modes().join(' / ')} · zonder beweging`;
}
field.ready.then(updateStatus);

// ‘Gras uit’ haalt de veldklasse weg: dan geldt weer de gewone opmaak.
const toggle = document.querySelector('[data-grass-toggle]');
toggle.addEventListener('click', () => {
  enabled = !enabled;
  toggle.setAttribute('aria-pressed', String(enabled));
  toggle.textContent = `Gras ${enabled ? 'aan' : 'uit'}`;
  panels.forEach(panel => panel.classList.toggle('scc-turf', enabled));
  field.setEnabled(enabled);
  updateStatus();
});
document.querySelector('#grass-light').addEventListener('input', event => panels.forEach(panel => panel.style.setProperty('--turf-light', event.target.value / 100)));
updateStatus();

// Herhaalde regels testen uitsluitend de hoogte, niet de wedstrijddata.
const heightButton = document.querySelector('[data-grass-height]');
const goalList = document.querySelector('.grass-example .scc-board-line');
heightButton.disabled = !goalList;
heightButton.addEventListener('click', () => {
  const active = heightButton.getAttribute('aria-pressed') !== 'true';
  heightButton.setAttribute('aria-pressed', String(active));
  document.querySelector('[data-grass-height-note]').hidden = !active;
  if (active) {
    const goals = [...goalList.querySelectorAll('.scc-board-goal')];
    for (let i = 0; i < 3; i++) for (const goal of goals) {
      const clone = goal.cloneNode(true);
      clone.dataset.heightTest = '';
      goalList.append(clone);
    }
  } else goalList.querySelectorAll('[data-height-test]').forEach(goal => goal.remove());
});

const lightToggle = document.querySelector('[data-grass-lights]');
lightToggle.addEventListener('click', () => {
  lightsEnabled = !lightsEnabled;
  lightToggle.setAttribute('aria-pressed', String(lightsEnabled));
  lightToggle.textContent = `Stadionlicht ${lightsEnabled ? 'aan' : 'uit'}`;
  field.setLights(lightsEnabled);
});
document.querySelector('[data-grass-replay]').addEventListener('click', () => {
  if (!enabled) toggle.click();
  if (!lightsEnabled) lightToggle.click();
  field.replay();
});

// Vergelijken: automatisch volgens de aftraptijd, of vast avond of middag.
const momentButton = document.querySelector('[data-grass-moment]');
const momentLabels = { auto: 'automatisch', avond: 'avond', middag: 'middag' };
let moment = 'auto';
momentButton.addEventListener('click', () => {
  moment = { auto: 'avond', avond: 'middag', middag: 'auto' }[moment];
  momentButton.textContent = `Lichtmoment: ${momentLabels[moment]}`;
  field.setMoment(moment);
  updateStatus();
});
