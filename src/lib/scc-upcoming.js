import rounds2026 from "../scc/rounds-2026-2027.json" with { type: "json" };

export const programUrl = "https://cambuur.nl/eerste-elftal/matchcenter/";
const dayFormatter = new Intl.DateTimeFormat("en-US", {
	timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
});
const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
	timeZone: "Europe/Amsterdam", weekday: "short", day: "2-digit", month: "short",
});
const timeFormatter = new Intl.DateTimeFormat("nl-NL", {
	timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit",
});

export function amsterdamDay(value) {
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) throw new Error("Ongeldige speeldatum.");
	const parts = dayFormatter.formatToParts(date);
	const part = type => parts.find(item => item.type === type)?.value;
	return `${part("year")}-${part("month")}-${part("day")}`;
}

export function upcomingRows(snapshot, now = new Date()) {
	const today = amsterdamDay(now);
	return (snapshot?.fixtures ?? []).filter(row => amsterdamDay(row.date) >= today)
		.slice(0, 5).map(row => ({
			...row,
			day: dateFormatter.format(new Date(row.date)).replaceAll(".", ""),
			time: timeFormatter.format(new Date(row.date)),
			context: row.round ? `${row.competition} · Ronde ${row.round}` : row.competition,
			venue: row.home === "SC Cambuur" ? "Thuis" : "Uit",
		}));
}

export function refreshDue(snapshot, now = new Date()) {
	if (snapshot?.retryAfter && now.getTime() < new Date(snapshot.retryAfter).getTime()) return false;
	if (!snapshot?.checkedAt) return true;
	const first = snapshot.fixtures?.[0];
	if (first) return amsterdamDay(now) > amsterdamDay(first.date);
	return now.getTime() - new Date(snapshot.checkedAt).getTime() >= 7 * 24 * 60 * 60 * 1000;
}

export function latestSnapshot(stored, seed) {
	const storedAt = Date.parse(stored?.checkedAt ?? "");
	const seedAt = Date.parse(seed?.checkedAt ?? "");
	return Number.isFinite(storedAt) && storedAt >= seedAt ? stored : seed;
}

function decode(value) {
	const named = { amp: "&", nbsp: " ", quot: '"', apos: "'", eacute: "é", euml: "ë" };
	return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity) => {
		if (entity.startsWith("#")) {
			const number = entity[1].toLowerCase() === "x"
				? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
			return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : whole;
		}
		return named[entity.toLowerCase()] ?? whole;
	}).replace(/\s+/g, " ").trim();
}

function fixtureDate(day, time) {
	const [, dd, mm, yyyy] = /^(\d{2})\/(\d{2})\/(20\d{2})$/.exec(day) ?? [];
	const [, hour, minute] = /^(\d{2})\.(\d{2}) uur$/.exec(time) ?? [];
	if (!dd || !hour || Number(hour) > 23 || Number(minute) > 59 ||
		new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd))).toISOString().slice(0, 10)
			!== `${yyyy}-${mm}-${dd}`) throw new Error("Ongeldige datum of tijd in het Cambuur-programma.");
	const midday = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12));
	const zone = new Intl.DateTimeFormat("en-US", {
		timeZone: "Europe/Amsterdam", timeZoneName: "shortOffset",
	}).formatToParts(midday).find(part => part.type === "timeZoneName")?.value;
	const [, sign, hours, minutes = "00"] = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zone) ?? [];
	if (!sign) throw new Error("Kan de Amsterdamse tijdzone niet bepalen.");
	return `${yyyy}-${mm}-${dd}T${hour}:${minute}:00${sign}${hours.padStart(2, "0")}:${minutes}`;
}

function normalizeTeam(value) {
	const name = decode(value);
	return /^(sc )?cambuur$/i.test(name) ? "SC Cambuur" : name;
}

function roundFor(home, away, date) {
	const year = Number(date.slice(0, 4));
	const month = Number(date.slice(5, 7));
	if ((month >= 7 ? year : year - 1) !== 2026) return null;
	return rounds2026[`${home.toLowerCase()}|${away.toLowerCase()}`] ?? null;
}

// Lees alleen de programmatabellen uit het eerste elftal; bij een gewijzigde
// clubpagina faalt de import en blijft de vorige snapshot bestaan.
export function parseUpcoming(html, checkedAt = new Date()) {
	const article = /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1];
	if (!article || !/<h1>Programma<\/h1>/i.test(article)) {
		throw new Error("De Cambuur-pagina bevat geen herkenbaar programma.");
	}
	const sections = [...article.matchAll(/<div class=['"]content-title['"][^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi)];
	if (!sections.length) throw new Error("Geen competities in het Cambuur-programma.");
	const fixtures = [];
	for (let i = 0; i < sections.length; i++) {
		const label = decode(sections[i][1]);
		const competition = /KNVB Beker/i.test(label) ? "KNVB Beker"
			: /Eredivisie/i.test(label) ? "Eredivisie" : label;
		const body = article.slice(sections[i].index + sections[i][0].length,
			sections[i + 1]?.index ?? article.length);
		const rows = [...body.matchAll(/<div class="row">\s*<div class="item-1">([^<]*)<\/div>\s*<div class="item-2">([^<]*)<\/div>\s*<div class="item-3">([^<]*)<\/div>\s*<div class="item-4">([^<]*)<\/div>\s*<\/div>/gi)];
		if ((body.match(/class="row"/g) ?? []).length !== rows.length) {
			throw new Error("Onbekende rijopbouw in het Cambuur-programma.");
		}
		for (const [, day, time, rawHome, rawAway] of rows) {
			const home = normalizeTeam(rawHome);
			const away = normalizeTeam(rawAway);
			if ((home === "SC Cambuur") === (away === "SC Cambuur")) {
				throw new Error("Wedstrijd zonder eenduidige Cambuur-ploeg.");
			}
			const date = fixtureDate(decode(day), decode(time));
			fixtures.push({ date, home, away, competition,
				round: competition === "Eredivisie" ? roundFor(home, away, date) : null });
		}
	}
	const today = amsterdamDay(checkedAt);
	const upcoming = fixtures.filter(row => amsterdamDay(row.date) >= today)
		.sort((a, b) => new Date(a.date) - new Date(b.date));
	if (new Set(upcoming.map(row => `${row.date}|${row.home}|${row.away}`)).size !== upcoming.length) {
		throw new Error("Dubbele wedstrijd in het Cambuur-programma.");
	}
	return { checkedAt: checkedAt.toISOString(), fixtures: upcoming.slice(0, 5) };
}

export async function fetchUpcoming(fetcher = fetch, now = new Date()) {
	const response = await fetcher(programUrl, {
		headers: { Accept: "text/html" }, signal: AbortSignal.timeout(10000),
	});
	if (!response.ok) throw new Error(`Cambuur-programma antwoordde met HTTP ${response.status}.`);
	const html = await response.text();
	if (html.length > 1024 * 1024) throw new Error("Cambuur-programma is onverwacht groot.");
	return parseUpcoming(html, now);
}
