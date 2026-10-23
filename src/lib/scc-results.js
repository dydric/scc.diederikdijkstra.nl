// De officiële uitslagenpagina levert gespeelde competitiewedstrijden en bekerduels.
export const resultsUrl = "https://cambuur.nl/eerste-elftal/uitslagen/";

function decode(value) {
	return value.replace(/&(?:amp|nbsp|quot|apos|#\d+|#x[\da-f]+);/gi, entity => {
		const names = { "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&apos;": "'" };
		if (names[entity.toLowerCase()]) return names[entity.toLowerCase()];
		const hex = /^&#x([\da-f]+);$/i.exec(entity);
		const decimal = /^&#(\d+);$/.exec(entity);
		const code = hex ? parseInt(hex[1], 16) : decimal ? Number(decimal[1]) : 0;
		return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
	}).replace(/\s+/g, " ").trim();
}

export function teamKey(name) {
	const key = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]/g, "").replace(/^sc/, "");
	return ({ az: "azalkmaar", nec: "necnijmegen", excelsior: "excelsiorrotterdam" })[key] ?? key;
}

export function parseResults(html) {
	const article = /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1];
	if (!article || !/<h1>Uitslagen<\/h1>/i.test(article)) throw new Error("De Cambuur-pagina bevat geen herkenbare uitslagen.");
	const sections = [...article.matchAll(/<div class=['"]content-title['"][^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi)];
	if (!sections.length) throw new Error("Geen competities op de Cambuur-uitslagenpagina.");
	const results = [];
	for (let i = 0; i < sections.length; i++) {
		const label = decode(sections[i][1]);
		const competition = /KNVB Beker/i.test(label) ? "KNVB Beker"
			: /Eredivisie/i.test(label) ? "Eredivisie"
				: /Eerste Divisie|Keuken Kampioen Divisie/i.test(label) ? "Eerste Divisie" : null;
		if (!competition) continue;
		const body = article.slice(sections[i].index + sections[i][0].length, sections[i + 1]?.index ?? article.length);
		const rows = [...body.matchAll(/<div class="row">\s*<div class="item-1">([^<]*)<\/div>\s*<div class="item-2">([^<]*)<\/div>\s*<div class="item-3">([^<]*)<\/div>\s*<div class="item-4">([^<]*)<\/div>\s*<\/div>/gi)];
		if ((body.match(/class="row"/g) ?? []).length !== rows.length) throw new Error("Onbekende rijopbouw in de Cambuur-uitslagen.");
		for (const [, rawDate, rawHome, rawAway, rawScore] of rows) {
			const [, day, month, year] = /^(\d{2})\/(\d{2})\/(20\d{2})$/.exec(decode(rawDate)) ?? [];
			const score = /^(\d+)-(\d+)$/.exec(decode(rawScore));
			const home = decode(rawHome);
			const away = decode(rawAway);
			if (!day || !score || new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString().slice(0, 10) !== `${year}-${month}-${day}` ||
				(teamKey(home) === "cambuur") === (teamKey(away) === "cambuur")) {
				throw new Error("Ongeldige wedstrijd op de Cambuur-uitslagenpagina.");
			}
			results.push({ date: `${year}-${month}-${day}`, home, away, score: { home: Number(score[1]), away: Number(score[2]) }, competition });
		}
	}
	if (!results.length) throw new Error("Geen gespeelde competitie- of bekerwedstrijden op de Cambuur-uitslagenpagina.");
	if (new Set(results.map(row => `${row.date}|${teamKey(row.home)}|${teamKey(row.away)}`)).size !== results.length) {
		throw new Error("Dubbele wedstrijd op de Cambuur-uitslagenpagina.");
	}
	return results;
}

export async function fetchResults(fetcher = fetch) {
	const response = await fetcher(resultsUrl, { headers: { Accept: "text/html" }, signal: AbortSignal.timeout(10000) });
	if (!response.ok) throw new Error(`Cambuur-uitslagen antwoordde met HTTP ${response.status}.`);
	const html = await response.text();
	if (html.length > 1024 * 1024) throw new Error("Cambuur-uitslagenpagina is onverwacht groot.");
	return parseResults(html);
}
