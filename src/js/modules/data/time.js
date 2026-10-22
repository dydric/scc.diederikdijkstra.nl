// Bestand: js/modules/data/time.js
//
// De tijd in Leeuwarden, wat de tijdzone van de bezoeker ook is:
// localTime() geeft uu:mm:ss, localDate() de datum, localOffset() het
// verschil met UTC (UTC+2, in de winter UTC+1), onTick(fn) roept fn elke
// seconde aan, op de seconde (een paar ms erna, zodat de seconde zeker om
// is). Gebruikt door de console (modules/console/lines.js). De klok met
// digits van het vorige paneel staat in het archief:
// docs/archief/effecten.md.

const TIME_ZONE = 'Europe/Amsterdam';

const time = new Intl.DateTimeFormat('en-GB', {
	timeZone: TIME_ZONE,
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false,
});

export const localTime = (date = new Date()) => time.format(date);

// De datum, Engels zoals de rest van de console: TUE 14 OCT 2026.
const day = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const localDate = (date = new Date()) => day.format(date).replace(',', '').toUpperCase();

const zone = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, timeZoneName: 'shortOffset' });

export const localOffset = (date = new Date()) =>
	zone
		.formatToParts(date)
		.find((part) => part.type === 'timeZoneName')
		.value.replace('GMT', 'UTC');

// Geeft een functie terug die de klok stopt.
export const onTick = (fn) => {
	let timer = 0;
	const tick = () => {
		fn();
		timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
	};
	tick();
	return () => clearTimeout(timer);
};
