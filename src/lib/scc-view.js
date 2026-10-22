import { markdownDate } from "./scc-matchdata.js";

// Toon bekerwedstrijden op datum tussen de competitiewedstrijden.
export function matchGroups(matches) {
	const ordered = [...matches].reverse();
	const leagueBySeason = new Map();
	for (const wedstrijd of ordered) {
		const { competition, season } = wedstrijd.data;
		if (competition !== "KNVB Beker" && !leagueBySeason.has(season)) {
			leagueBySeason.set(season, competition);
		}
	}
	const groups = new Map();
	for (const wedstrijd of ordered) {
		const { competition, season } = wedstrijd.data;
		const groupCompetition = competition === "KNVB Beker"
			? (leagueBySeason.get(season) ?? competition)
			: competition;
		const key = `${groupCompetition}\u0000${season}`;
		if (!groups.has(key)) {
			groups.set(key, {
				title: `${groupCompetition} ${season.replace("-", "/")}`,
				competition: groupCompetition,
				matches: [],
			});
		}
		groups.get(key).matches.push(wedstrijd);
	}
	return [...groups.values()];
}

// Dezelfde JSON staat inline op de pagina en als afzonderlijk bestand.
export function matchJson(wedstrijd) {
	const { data, templateContent } = wedstrijd;
	return JSON.stringify({
		season: data.season,
		date: markdownDate(data.date),
		title: data.title,
		competition: data.competition,
		home: data.home,
		away: data.away,
		score: data.score,
		videoUrl: data.videoAvailable === false ? null : data.videoUrl ?? null,
		videoTitle: data.videoAvailable === false ? null : data.videoTitle ?? null,
		reportHtml: templateContent?.trim() || null,
		matchdata: data.matchdata,
		match: data.match,
	}, null, 2) + "\n";
}
