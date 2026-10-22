import { matchStory } from "./scc-match-story.js";

const fallbackLeagues = new Set(["Eredivisie", "Eerste Divisie"]);
const dutchNumber = new Intl.NumberFormat("nl-NL", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});
const kickoffTime = new Intl.DateTimeFormat("nl-NL", {
	timeZone: "Europe/Amsterdam",
	hour: "2-digit",
	minute: "2-digit",
});

function minute(time) {
	if (!Number.isInteger(time?.elapsed)) return "–";
	return `${time.elapsed}${time.extra ? `+${time.extra}` : ""}′`;
}

function statistic(team, type) {
	return team?.statistics?.find(item => item.type === type)?.value ?? null;
}

function displayedValue(value, decimal = false) {
	if (value === null || value === undefined) return "–";
	if (decimal) {
		const number = Number(value);
		return Number.isFinite(number) ? dutchNumber.format(number) : "–";
	}
	return String(value);
}

export function roundLabel(match, competition) {
	const round = match?.league?.round;
	if (!round) return null;
	const name = competition === "KNVB Beker" ? "Beker" : competition;
	const leagueRound = /^Regular Season - (\d+)$/.exec(round);
	if (leagueRound) return `${name} - Ronde ${leagueRound[1]}`;
	const preliminaryRound = /^(\d+)(?:st|nd|rd|th) Preliminary Round$/.exec(round);
	if (preliminaryRound) return `${name} - ${preliminaryRound[1]}e voorronde`;
	return `${name} - ${round}`;
}

function videoView(data) {
	if (!data.videoUrl || data.videoAvailable === false) return null;
	try {
		const url = new URL(data.videoUrl);
		if (![
			"youtube.com", "www.youtube.com",
		].includes(url.hostname) || url.pathname !== "/watch") return null;
		const id = url.searchParams.get("v");
		if (!/^[A-Za-z0-9_-]{11}$/.test(id ?? "")) return null;
		return {
			embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
			url: `https://www.youtube.com/watch?v=${id}`,
			title: data.videoTitle || `Wedstrijdvideo: ${data.title}`,
		};
	} catch {
		return null;
	}
}

function eventLabel(event) {
	if (event.type === "Goal") {
		if (event.detail === "Penalty") return "Strafschopgoal";
		if (event.detail === "Own Goal") return "Eigen doelpunt";
		return "Doelpunt";
	}
	if (event.type === "Card") return event.detail === "Yellow Card" ? "Gele kaart" : "Rode kaart";
	const varLabels = {
		"Goal cancelled": "Doelpunt afgekeurd",
		"Penalty confirmed": "Strafschop bevestigd",
		"Penalty cancelled": "Strafschop ingetrokken",
	};
	return `VAR · ${varLabels[event.detail] ?? event.detail ?? "beslissing"}`;
}

function eventTimeline(match, data) {
	const events = (match.events ?? [])
		.filter(event => event.type === "Goal" || event.type === "Var" ||
			(event.type === "Card" && ["Yellow Card", "Red Card"].includes(event.detail)))
		.map((event, index) => ({ event, index }))
		.sort((a, b) => (a.event.time?.elapsed ?? 0) - (b.event.time?.elapsed ?? 0) ||
			(a.event.time?.extra ?? 0) - (b.event.time?.extra ?? 0) || a.index - b.index);
	let home = 0;
	let away = 0;
	return events.map(({ event }) => {
		if (event.type === "Goal") {
			if (event.team?.id === match.teams.home.id) home += 1;
			if (event.team?.id === match.teams.away.id) away += 1;
		}
		return {
			minute: minute(event.time),
			label: eventLabel(event),
			team: event.team?.id === match.teams.home.id ? data.home
				: event.team?.id === match.teams.away.id ? data.away : event.team?.name ?? "–",
			player: event.player?.name ?? null,
			assist: event.type === "Goal" && event.detail !== "Own Goal"
				? event.assist?.name ?? null : null,
			score: event.type === "Goal" ? `${home}–${away}` : null,
			type: event.type,
		};
	});
}

function comparison(match) {
	const home = match.statistics?.find(item => item.team?.id === match.teams.home.id);
	const away = match.statistics?.find(item => item.team?.id === match.teams.away.id);
	const metrics = [
		["Schoten op doel", "Shots on Goal"],
		["Schoten totaal", "Total Shots"],
		["Balbezit", "Ball Possession"],
		["Verwachte doelpunten (xG)", "expected_goals", true],
		["Hoekschoppen", "Corner Kicks"],
	];
	return metrics.flatMap(([label, type, decimal]) => {
		const homeValue = statistic(home, type);
		const awayValue = statistic(away, type);
		if (homeValue === null && awayValue === null) return [];
		return [{ label, home: displayedValue(homeValue, decimal),
			away: displayedValue(awayValue, decimal) }];
	});
}

function playerStatistics(team, player) {
	if (!team || !player) return null;
	const entry = team.players?.find(item => player.id != null && item.player?.id === player.id)
		?? team.players?.find(item => item.player?.name?.toLowerCase() === player.name?.toLowerCase());
	return entry?.statistics?.[0] ?? null;
}

function playerRow(player, statistics) {
	const games = statistics?.games;
	const details = [];
	if (games?.captain) details.push("Aanvoerder");
	if (statistics?.goals?.total > 0) details.push(`${statistics.goals.total} goal${statistics.goals.total === 1 ? "" : "s"}`);
	if (statistics?.goals?.assists > 0) details.push(`${statistics.goals.assists} assist${statistics.goals.assists === 1 ? "" : "s"}`);
	if (statistics?.cards?.yellow > 0) details.push(`${statistics.cards.yellow}× geel`);
	if (statistics?.cards?.red > 0) details.push(`${statistics.cards.red}× rood`);
	return {
		name: player?.name ?? "–",
		number: player?.number ?? games?.number ?? "–",
		position: { G: "Keeper", D: "Verdediger", M: "Middenvelder", F: "Aanvaller" }[player?.pos ?? games?.position] ?? null,
		grid: /^\d+:\d+$/.test(player?.grid ?? "") ? player.grid : null,
		minutes: Number.isInteger(games?.minutes) ? `${games.minutes}′` : "–",
		rating: Number(games?.rating) > 0 ? dutchNumber.format(Number(games.rating)) : "–",
		details,
	};
}

function formationFromGrid(starters) {
	if (starters.length !== 11 || starters.some(player => !player.grid)) return null;
	const lines = new Map();
	for (const player of starters) {
		const line = Number(player.grid.split(":")[0]);
		lines.set(line, (lines.get(line) ?? 0) + 1);
	}
	const lastLine = Math.max(...lines.keys());
	if (lastLine < 3 || lines.get(1) !== 1 ||
		Array.from({ length: lastLine }, (_, index) => index + 1).some(line => !lines.has(line))) return null;
	return {
		label: Array.from({ length: lastLine - 1 }, (_, index) => lines.get(index + 2)).join("-"),
		lastLine,
	};
}

function fieldPosition(player, formation) {
	if (!formation || !player.grid) {
		return { Keeper: "Keeper", Verdediger: "Verdediger", Middenvelder: "Middenveld", Aanvaller: "Aanval" }[player.position] ?? null;
	}
	const line = Number(player.grid.split(":")[0]);
	if (line === 1) return "Keeper";
	if (line === 2) return "Verdediger";
	return line === formation.lastLine ? "Aanval" : "Middenveld";
}

function lineups(match, data) {
	return ["home", "away"].flatMap(side => {
		const teamId = match.teams?.[side]?.id;
		const lineup = match.lineups?.find(item => item.team?.id === teamId);
		if (!lineup) return [];
		const teamStats = match.players?.find(item => item.team?.id === teamId);
		const starters = (lineup.startXI ?? []).map(item =>
			playerRow(item.player, playerStatistics(teamStats, item.player)));
		const formation = formationFromGrid(starters);
		for (const player of starters) player.fieldPosition = fieldPosition(player, formation);
		const substitutions = (match.events ?? [])
			.filter(event => event.type === "subst" && event.team?.id === teamId)
			.map(event => {
				const player = lineup.substitutes?.find(item =>
					(event.assist?.id != null && item.player?.id === event.assist.id) ||
					(event.assist?.name && item.player?.name?.toLowerCase() === event.assist.name.toLowerCase()))?.player
					?? event.assist;
				return {
					...playerRow(player, playerStatistics(teamStats, player)),
					entered: minute(event.time),
					replaced: event.player?.name ?? null,
				};
			});
		return [{
			name: data[side],
			formation: formation?.label ?? null,
			coach: lineup.coach?.name ?? null,
			starters,
			substitutions,
		}];
	});
}

// Eén leesmodel voor de voorlopige wedstrijdpagina; de ruwe JSON blijft beschikbaar.
// Nederlandse scheidsrechters alleen met naam; buitenlandse houden hun land.
function refereeName(referee) {
	if (!referee) return null;
	return referee.replace(/,\s*Netherlands$/i, "");
}

export function matchView(wedstrijd) {
	const { data } = wedstrijd;
	const match = data.match;
	const cambuurHome = data.home === "SC Cambuur";
	const forGoals = cambuurHome ? data.score.home : data.score.away;
	const againstGoals = cambuurHome ? data.score.away : data.score.home;
	const outcome = forGoals > againstGoals ? "Winst"
		: forGoals < againstGoals ? "Verlies" : "Gelijkspel";
	const league = match ? match.league?.standings === true : fallbackLeagues.has(data.competition);
	const points = league ? (forGoals > againstGoals ? 3 : forGoals === againstGoals ? 1 : 0) : null;
	const timeline = match ? eventTimeline(match, data) : [];
	const story = matchStory(wedstrijd);
	const round = roundLabel(match, data.competition);
	const venue = match?.fixture?.venue?.name ?? null;
	const kickoff = match?.fixture?.date ? kickoffTime.format(new Date(match.fixture.date)) : null;
	return {
		outcome,
		points,
		pointsShort: points === null ? "Beker" : `+${points}`,
		pointsText: points === null ? (data.competition === "KNVB Beker"
			? "Bekerwedstrijd · geen competitiepunten" : "Geen competitiepunten")
			: `+${points} competitiepunt${points === 1 ? "" : "en"}`,
		venue,
		kickoff,
		round,
		referee: refereeName(match?.fixture?.referee),
		timeline,
		stats: match ? comparison(match) : [],
		lineups: match ? lineups(match, data) : [],
		video: videoView(data),
		story,
	};
}
