// Leesmodel voor het overzicht op /: per seizoen de wedstrijden als
// minimale rijen, de vorm als strook en de totalen van deze selectie.
// Alle tellingen gaan over de wedstrijden in de collectie, niet over een
// volledige competitie: de selectie van 2025/2026 is geen complete kalender.

import { matchGroups } from "./scc-view.js";
import { matchStory, ratingBand } from "./scc-match-story.js";
import { roundLabel } from "./scc-match-view.js";

// Zelfde notatie als het programma: "za 18 okt".
const day = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "2-digit", month: "short", timeZone: "Europe/Amsterdam" });
const year = new Intl.DateTimeFormat("nl-NL", { year: "numeric", timeZone: "Europe/Amsterdam" });

// Vijftien minuten per vak; blessuretijd hoort bij het laatste vak van de helft.
const BUCKETS = ["0–15", "16–30", "31–45+", "46–60", "61–75", "76–90+"];
function bucket(time) {
	const elapsed = time?.elapsed ?? 0;
	if (elapsed <= 15) return 0;
	if (elapsed <= 30) return 1;
	if (elapsed <= 45) return 2;
	if (elapsed <= 60) return 3;
	if (elapsed <= 75) return 4;
	return 5;
}

// Ook los te gebruiken (filter sccMatchRow), voor de vorige/volgende-kaarten.
export function row(wedstrijd) {
	const { data } = wedstrijd;
	const side = data.home === "SC Cambuur" ? "home" : "away";
	const other = side === "home" ? "away" : "home";
	const goalsFor = data.score[side];
	const goalsAgainst = data.score[other];
	const result = goalsFor > goalsAgainst ? "winst" : goalsFor < goalsAgainst ? "verlies" : "gelijk";
	const date = new Date(`${data.matchDate}T12:00:00Z`);
	const cup = data.competition === "KNVB Beker";
	// Door in de beker: gewonnen, of na strafschoppen (score.penalty).
	const penalties = data.match?.score?.penalty;
	const penaltyWin = Number.isInteger(penalties?.home) && Number.isInteger(penalties?.away) &&
		(side === "home" ? penalties.home > penalties.away : penalties.away > penalties.home);
	return {
		url: data.matchUrl,
		title: data.title,
		date: data.matchDate,
		day: day.format(date).replaceAll(".", ""),
		year: year.format(date),
		venue: side === "home" ? "Thuis" : "Uit",
		venueShort: side === "home" ? "T" : "U",
		opponent: data[other],
		score: `${data.score.home}–${data.score.away}`,
		home: data.score.home,
		away: data.score.away,
		goalsFor,
		goalsAgainst,
		result,
		states: matchStory(wedstrijd).states,
		letter: { winst: "W", gelijk: "G", verlies: "V" }[result],
		points: cup ? null : result === "winst" ? 3 : result === "gelijk" ? 1 : 0,
		cup,
		advanced: cup ? data.score[side] > data.score[side === "home" ? "away" : "home"] || penaltyWin : null,
		competition: data.competition,
		// Alleen de ronde, zonder competitie: "Ronde 8", "1e voorronde".
		round: roundLabel(data.match, data.competition)?.split(" - ").pop() ?? null,
		hasVideo: Boolean(data.videoUrl) && data.videoAvailable !== false,
	};
}

function tally(rows) {
	const count = key => rows.filter(item => item.result === key).length;
	const goalsFor = rows.reduce((sum, item) => sum + item.goalsFor, 0);
	const goalsAgainst = rows.reduce((sum, item) => sum + item.goalsAgainst, 0);
	const league = rows.filter(item => !item.cup);
	return {
		played: rows.length,
		wins: count("winst"),
		draws: count("gelijk"),
		losses: count("verlies"),
		goalsFor,
		goalsAgainst,
		difference: goalsFor - goalsAgainst,
		differenceText: `${goalsFor - goalsAgainst > 0 ? "+" : ""}${goalsFor - goalsAgainst}`,
		points: league.reduce((sum, item) => sum + item.points, 0),
		leagueGames: league.length,
	};
}

// Wanneer valt een goal, voor en tegen Cambuur, over alle wedstrijden.
function minuteProfile(matches) {
	const goalsFor = BUCKETS.map(() => 0);
	const goalsAgainst = BUCKETS.map(() => 0);
	for (const wedstrijd of matches) {
		const match = wedstrijd.data.match;
		if (!match) continue;
		const cambuurId = wedstrijd.data.home === "SC Cambuur" ? match.teams.home.id : match.teams.away.id;
		for (const event of match.events ?? []) {
			if (event.type !== "Goal" || event.detail === "Missed Penalty") continue;
			const byCambuur = event.team?.id === cambuurId;
			(byCambuur ? goalsFor : goalsAgainst)[bucket(event.time)] += 1;
		}
	}
	const max = Math.max(1, ...goalsFor, ...goalsAgainst);
	return BUCKETS.map((label, index) => ({
		label,
		for: goalsFor[index],
		against: goalsAgainst[index],
		forHeight: Math.round(goalsFor[index] / max * 100),
		againstHeight: Math.round(goalsAgainst[index] / max * 100),
	}));
}

const decimal = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Over alle wedstrijden met opgeslagen data: wie scoort, wie geeft de
// assist, wie haalt de hoogste cijfers, en hoe vaak komt Cambuur terug.
function seasonStats(matches, rows, minimum = 5) {
	const scorers = new Map();
	const assists = new Map();
	const ratings = new Map();
	let yellow = 0;
	let red = 0;
	let comebacks = 0;
	let comebackPoints = 0;
	const count = (map, person, name) => {
		const key = person?.id ?? person?.name;
		if (!key) return;
		const entry = map.get(key) ?? { name: name ?? person.name, count: 0 };
		// De langste naam wint: "Nicolas Binder" boven "N. Binder".
		if ((name ?? person.name)?.length > entry.name.length) entry.name = name ?? person.name;
		entry.count += 1;
		map.set(key, entry);
	};
	for (const wedstrijd of matches) {
		const match = wedstrijd.data.match;
		if (!match) continue;
		const home = wedstrijd.data.home === "SC Cambuur";
		const cambuurId = home ? match.teams.home.id : match.teams.away.id;
		let diff = 0;
		let behind = false;
		const events = [...(match.events ?? [])].sort((a, b) =>
			(a.time.elapsed + (a.time.extra ?? 0)) - (b.time.elapsed + (b.time.extra ?? 0)));
		for (const event of events) {
			const own = event.team?.id === cambuurId;
			if (event.type === "Goal" && event.detail !== "Missed Penalty") {
				// Ook een eigen goal staat bij de ploeg die de goal krijgt.
				diff += own ? 1 : -1;
				if (diff < 0) behind = true;
				if (own && event.detail !== "Own Goal") {
					count(scorers, event.player);
					if (event.detail === "Normal Goal" && event.assist?.name) count(assists, event.assist);
				}
			}
			if (own && event.type === "Card") {
				if (event.detail === "Yellow Card") yellow += 1;
				if (event.detail === "Red Card") red += 1;
			}
		}
		const { score } = wedstrijd.data;
		const goalsFor = home ? score.home : score.away;
		const goalsAgainst = home ? score.away : score.home;
		if (behind && goalsFor >= goalsAgainst) {
			comebacks += 1;
			comebackPoints += goalsFor > goalsAgainst ? 3 : 1;
		}
		for (const entry of match.players?.find(item => item.team?.id === cambuurId)?.players ?? []) {
			const rating = Number(entry.statistics?.[0]?.games?.rating);
			if (!(rating > 0)) continue;
			const key = entry.player.id ?? entry.player.name;
			const item = ratings.get(key) ?? { name: entry.player.name, sum: 0, count: 0 };
			item.sum += rating;
			item.count += 1;
			ratings.set(key, item);
		}
	}
	// Eén naam per speler: de langste die ergens voorkomt ("Ichem Ferrah"
	// boven "I. Ferrah").
	const names = new Map();
	for (const map of [scorers, assists, ratings]) for (const [key, item] of map) {
		if ((names.get(key)?.length ?? 0) < item.name.length) names.set(key, item.name);
	}
	for (const map of [scorers, assists, ratings]) for (const [key, item] of map) item.name = names.get(key);
	const top = (map, limit = 5) => {
		const list = [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);
		const max = list[0]?.count || 1;
		return list.map(item => ({ ...item, share: Math.round(item.count / max * 100) }));
	};
	const rated = [...ratings.values()].filter(item => item.count >= minimum)
		.map(item => ({ name: item.name, count: item.count, average: item.sum / item.count }))
		.sort((a, b) => b.average - a.average).slice(0, 5)
		.map(item => ({ ...item, averageText: decimal.format(Math.round(item.average * 10) / 10), band: ratingBand(item.average) }));
	const venue = key => {
		const list = rows.filter(item => item.venue === key);
		return { ...tally(list), venue: key };
	};
	const biggest = [...rows].sort((a, b) => (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor)[0] ?? null;
	const scorerList = top(scorers, 20);
	const most = scorerList[0]?.count ?? 0;
	return {
		scorers: scorerList.slice(0, 5),
		// De topscorer(s): bij een gelijk aantal allemaal, daarna de volgende twee.
		topScorers: scorerList.filter(item => item.count === most),
		nextScorers: scorerList.filter(item => item.count < most).slice(0, 2),
		assists: top(assists),
		ratings: rated,
		home: venue("Thuis"),
		away: venue("Uit"),
		cleanSheets: rows.filter(item => item.goalsAgainst === 0).length,
		comebacks,
		comebackPoints,
		yellow,
		red,
		biggest,
		goalsPerMatch: rows.length ? decimal.format(rows.reduce((sum, item) => sum + item.goalsFor, 0) / rows.length) : "–",
	};
}

export function archive(collection) {
	const groups = matchGroups(collection).map(group => {
		const rows = group.matches.map(row);
		return {
			title: group.title,
			competition: group.competition,
			season: group.matches[0]?.data.season ?? "",
			rows,
			// De vorm van oud naar nieuw, zoals een seizoen loopt.
			form: [...rows].reverse(),
			tally: tally(rows),
			// Hoogste gemiddelde: minimaal een derde van de wedstrijden, en minstens 3.
			stats: seasonStats(group.matches, rows, Math.max(3, Math.ceil(rows.length / 3))),
		};
	});
	const all = groups.flatMap(group => group.rows);
	// Volgnummer in de tijd (1 is de oudste), voor het meelopende bord.
	all.forEach((item, index) => { item.number = all.length - index; });
	return {
		groups,
		tally: tally(all),
		profile: minuteProfile([...collection]),
		first: all.at(-1) ?? null,
		last: all[0] ?? null,
	};
}
