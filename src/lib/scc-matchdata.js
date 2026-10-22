import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sameTeamName } from "./scc-team-names.js";

const sccRoot = fileURLToPath(new URL("../scc/", import.meta.url));

export function markdownDate(value) {
	const date = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error("Ongeldige wedstrijddatum in de front matter.");
	}
	return date;
}

function localDate(iso) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Europe/Amsterdam",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date(iso));
	const part = type => parts.find(item => item.type === type)?.value;
	return `${part("year")}-${part("month")}-${part("day")}`;
}

// Een gekoppelde wedstrijd leest uitsluitend de opgeslagen API-respons.
export function loadMatchData(data) {
	const id = data.matchdata;
	if (id === null || id === undefined || id === "") return null;
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new Error(`Ongeldig matchdata-ID in ${data.page?.inputPath ?? "wedstrijd"}.`);
	}
	const season = data.season;
	if (!/^20\d{2}-20\d{2}$/.test(season)) {
		throw new Error(`Ongeldig seizoen voor matchdata ${id}.`);
	}
	const file = path.join(sccRoot, "api", `${id}.json`);
	let payload;
	try {
		payload = JSON.parse(readFileSync(file, "utf8"));
	} catch (error) {
		throw new Error(`Kan matchdata ${id} niet lezen uit ${file}: ${error.message}`);
	}
	const match = payload?.response?.[0];
	if (payload?.results !== 1 || payload.response.length !== 1 ||
		match?.fixture?.id !== id || match.league?.season !== Number(season.slice(0, 4))) {
		throw new Error(`Matchdata ${id} bevat niet precies de verwachte wedstrijd.`);
	}
	if (localDate(match.fixture.date) !== markdownDate(data.date) ||
		!sameTeamName(data.home, match.teams?.home?.name) ||
		!sameTeamName(data.away, match.teams?.away?.name) ||
		data.score?.home !== match.goals?.home ||
		data.score?.away !== match.goals?.away) {
		throw new Error(`Matchdata ${id} wijkt af van de datum, ploegen of uitslag in de front matter.`);
	}
	return match;
}
