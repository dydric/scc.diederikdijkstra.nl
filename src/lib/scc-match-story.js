// Leesmodel voor de vormgegeven wedstrijdpagina: tijdlijn, goals, veld,
// rapportcijfers en teamcijfers. Alles uit de opgeslagen API-respons;
// niets wordt afgeleid wat de API niet vastlegt (geen oorzaak van een
// kaart, geen historische stand). scc-match-view.js voegt dit samen.

const decimal = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const longDate = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" });
const xgFormat = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// De vijf banden van een rapportcijfer. De API-beoordeling loopt in de
// praktijk van ongeveer 5 tot 10; 6 is de grens van voldoende.
export const RATING_BANDS = [
	{ key: "onvoldoende", label: "Onvoldoende", min: 0, range: "< 6,0" },
	{ key: "krap", label: "Krappe voldoende", min: 6, range: "6,0–6,4" },
	{ key: "voldoende", label: "Voldoende", min: 6.5, range: "6,5–6,9" },
	{ key: "goed", label: "Goed", min: 7, range: "7,0–7,9" },
	{ key: "uitblinker", label: "Uitblinker", min: 8, range: "≥ 8,0" },
];

export function ratingBand(value) {
	// De band volgt het getoonde cijfer: 5,96 staat er als 6,0 en is krap voldoende.
	const rating = Math.round(Number(value) * 10) / 10;
	if (!(rating > 0)) return null;
	return [...RATING_BANDS].reverse().find(band => rating >= band.min).key;
}

export function ratingText(value) {
	const rating = Number(value);
	return rating > 0 ? decimal.format(Math.round(rating * 10) / 10) : "–";
}

// Kort op het veld en in lijsten: "Nicolas Binder" → "Binder",
// "D. Bouah" → "Bouah", "R. El Arguioui" → "El Arguioui".
export function shortName(name) {
	if (!name) return "–";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0];
	if (/^\p{L}\.$/u.test(parts[0])) return parts.slice(1).join(" ");
	const particles = new Set(["van", "de", "der", "den", "el", "da", "di", "le", "ten", "ter"]);
	let start = parts.length - 1;
	while (start > 1 && particles.has(parts[start - 1].toLowerCase())) start -= 1;
	return parts.slice(start).join(" ");
}

const minuteValue = time => (time?.elapsed ?? 0) + (time?.extra ?? 0);
const minuteLabel = time => Number.isInteger(time?.elapsed)
	? `${time.elapsed}${time.extra ? `+${time.extra}` : ""}′` : "–";

function eventKind(event) {
	if (event.type === "Goal") {
		if (event.detail === "Penalty") return "penalty";
		if (event.detail === "Own Goal") return "owngoal";
		if (event.detail === "Missed Penalty") return null;
		return "goal";
	}
	if (event.type === "Card") {
		if (event.detail === "Yellow Card") return "yellow";
		if (event.detail === "Red Card") return "red";
		return null;
	}
	if (event.type === "Var") return "var";
	if (event.type === "subst") return "sub";
	return null;
}

const KIND_LABEL = {
	goal: "Doelpunt",
	penalty: "Strafschop",
	owngoal: "Eigen doelpunt",
	yellow: "Gele kaart",
	red: "Rode kaart",
	var: "VAR",
	sub: "Wissel",
};

const VAR_LABEL = {
	"Goal cancelled": "Doelpunt afgekeurd",
	"Penalty confirmed": "Strafschop bevestigd",
	"Penalty cancelled": "Strafschop ingetrokken",
};

// Alle momenten op één as. t is de plek op de as (0 t/m 1); lane schuift
// markeringen die dicht op elkaar vallen een rij op, per ploeg.
function moments(match, names, length) {
	const homeId = match.teams.home.id;
	const awayId = match.teams.away.id;
	const ordered = (match.events ?? [])
		.map((event, index) => ({ event, index, kind: eventKind(event) }))
		.filter(item => item.kind)
		.sort((a, b) => minuteValue(a.event.time) - minuteValue(b.event.time) || a.index - b.index);
	let home = 0;
	let away = 0;
	const lanes = { home: [], away: [] };
	return ordered.map(({ event, kind }) => {
		const side = event.team?.id === homeId ? "home" : event.team?.id === awayId ? "away" : null;
		const playerSide = kind === "owngoal" && side ? (side === "home" ? "away" : "home") : side;
		const goal = ["goal", "penalty", "owngoal"].includes(kind);
		// De API zet ook een eigen doelpunt bij de ploeg die ervan profiteert.
		if (goal && side) {
			if (side === "home") home += 1; else away += 1;
		}
		const value = minuteValue(event.time);
		const t = Math.min(1, Math.max(0, value / length));
		let lane = 0;
		if (side) {
			const used = lanes[side];
			while (used[lane] !== undefined && t - used[lane] < 0.045) lane += 1;
			used[lane] = t;
		}
		return {
			kind,
			goal,
			side,
			playerSide,
			team: side ? names[side] : event.team?.name ?? "–",
			playerTeam: playerSide ? names[playerSide] : event.team?.name ?? "–",
			minute: minuteLabel(event.time),
			value,
			t: Math.round(t * 10000) / 10000,
			// Hooguit vier rijen; daarboven schuift een moment over het vorige.
			lane: Math.min(lane, 3),
			label: kind === "var" ? `VAR · ${VAR_LABEL[event.detail] ?? event.detail ?? "beslissing"}` : KIND_LABEL[kind],
			// Bij een wissel is player de vervangen speler en assist de invaller.
			player: event.player?.name ?? null,
			assist: event.assist?.name ?? null,
			score: goal ? { home, away, text: `${home}–${away}` } : null,
		};
	});
}

// De feiten onder het scorebord: per ploeg wat de wedstrijd samenvat.
function matchFacts(match, side) {
	const other = side === "home" ? "away" : "home";
	const pick = (team) => match.statistics?.find(item => item.team?.id === match.teams[team].id)?.statistics ?? [];
	const value = (team, type) => {
		const raw = pick(team).find(item => item.type === type)?.value;
		const number = parseFloat(String(raw ?? "").replace("%", ""));
		return Number.isFinite(number) ? number : null;
	};
	const cards = (team, detail) => (match.events ?? []).filter(event => event.type === "Card" &&
		event.detail === detail && event.team?.id === match.teams[team].id).length;
	const both = (fn) => ({ cambuur: fn(side), opponent: fn(other) });
	return {
		shotsOn: both(team => value(team, "Shots on Goal")),
		shots: both(team => value(team, "Total Shots")),
		corners: both(team => value(team, "Corner Kicks")),
		yellow: both(team => cards(team, "Yellow Card")),
		red: both(team => cards(team, "Red Card")),
		saves: both(team => value(team, "Goalkeeper Saves")),
	};
}

// De markering staat bij de ploeg van de maker; de stand blijft bij de
// profiterende ploeg. De weergave verdeelt botsende symbolen per rij.
function stripMoments(list) {
	return list.filter(item => item.kind !== "sub" && item.side).map(item => ({
		...item,
		displaySide: item.playerSide,
	}));
}

// De stand vanuit Cambuur: voor, gelijk of achter, als stukken van de as.
function scoreStates(list, side, length) {
	const states = [];
	let from = 0;
	let diff = 0;
	for (const moment of list.filter(item => item.goal)) {
		const at = Math.min(1, moment.value / length);
		if (at > from) states.push({ from, to: at, diff });
		from = at;
		diff = side === "home" ? moment.score.home - moment.score.away : moment.score.away - moment.score.home;
	}
	states.push({ from, to: 1, diff });
	return states.map(state => ({
		...state,
		state: state.diff > 0 ? "voor" : state.diff < 0 ? "achter" : "gelijk",
		start: Math.round(state.from * 10000) / 100,
		width: Math.round((state.to - state.from) * 10000) / 100,
	})).filter(state => state.width > 0);
}

function teamStats(match) {
	const pick = (id) => match.statistics?.find(item => item.team?.id === id)?.statistics ?? [];
	const home = pick(match.teams.home.id);
	const away = pick(match.teams.away.id);
	const value = (list, type) => {
		const raw = list.find(item => item.type === type)?.value;
		if (raw === null || raw === undefined) return null;
		const number = parseFloat(String(raw).replace("%", ""));
		return Number.isFinite(number) ? number : null;
	};
	// In groepen, zodat de tabel leest als een wedstrijdrapport.
	const rows = [
		["Aanval", "Schoten", "Total Shots"],
		["Aanval", "Op doel", "Shots on Goal"],
		["Aanval", "In het strafschopgebied", "Shots insidebox"],
		["Aanval", "Hoekschoppen", "Corner Kicks"],
		["Spel", "Passes", "Total passes"],
		["Spel", "Geslaagde passes", "Passes accurate"],
		["Spel", "Passnauwkeurigheid", "pass_accuracy", "%"],
		["Verdediging", "Reddingen", "Goalkeeper Saves"],
		["Verdediging", "Overtredingen", "Fouls"],
		["Verdediging", "Gele kaarten", "Yellow Cards"],
	];
	const accuracy = list => {
		const total = value(list, "Total passes");
		const ok = value(list, "Passes accurate");
		return total && ok !== null ? Math.round(ok / total * 100) : null;
	};
	const bars = rows.flatMap(([group, label, type, unit]) => {
		const h = type === "pass_accuracy" ? accuracy(home) : value(home, type);
		const a = type === "pass_accuracy" ? accuracy(away) : value(away, type);
		if (h === null && a === null) return [];
		const hv = h ?? 0;
		const av = a ?? 0;
		const total = hv + av;
		const format = v => v === null ? "–" : unit === "xg" ? xgFormat.format(v) : unit === "%" ? `${v}%` : String(v);
		const max = Math.max(hv, av) || 1;
		return [{
			group,
			label,
			key: type,
			// Gespiegeld vanuit het midden: de grootste waarde vult zijn helft.
			homeWidth: Math.round(hv / max * 1000) / 10,
			awayWidth: Math.round(av / max * 1000) / 10,
			home: format(h),
			away: format(a),
			homeValue: hv,
			awayValue: av,
			homeShare: total ? Math.round(hv / total * 1000) / 10 : 50,
			lead: hv === av ? null : hv > av ? "home" : "away",
			decimals: unit === "xg" ? 2 : 0,
			suffix: unit === "%" ? "%" : "",
		}];
	});
	const possession = value(home, "Ball Possession");
	const groups = [...new Set(bars.map(bar => bar.group))].map(name => ({ name, rows: bars.filter(bar => bar.group === name) }));
	return {
		bars,
		groups,
		possession: possession === null ? null : {
			home: possession,
			away: value(away, "Ball Possession") ?? 100 - possession,
			// Honderd blokjes: elk blokje één procent.
			cells: Array.from({ length: 100 }, (_, index) => index < possession ? "home" : "away"),
		},
		xg: value(home, "expected_goals") === null ? null : {
			home: value(home, "expected_goals"),
			away: value(away, "expected_goals"),
			homeText: xgFormat.format(value(home, "expected_goals") ?? 0),
			awayText: xgFormat.format(value(away, "expected_goals") ?? 0),
		},
	};
}

function playerStats(teamPlayers, player) {
	const entry = teamPlayers?.players?.find(item => player?.id != null && item.player?.id === player.id)
		?? teamPlayers?.players?.find(item => item.player?.name?.toLowerCase() === player?.name?.toLowerCase());
	return entry?.statistics?.[0] ?? null;
}

// Wat een speler deed, voor het veld en de spelerkaart. Alleen wat de API
// telt; een ontbrekende waarde blijft weg.
function playerCard(player, stats) {
	const id = player?.id;
	const name = player?.name ?? "–";
	const rating = Number(stats?.games?.rating) > 0 ? Number(stats.games.rating) : null;
	const passes = stats?.passes?.total ?? null;
	const accurate = Number(stats?.passes?.accuracy);
	// share: het deel dat lukte (0 t/m 100), voor een meter; tone zegt of
	// dat sterk (pos) of zwak (neg) is. Passes vragen een hogere lat.
	const part = (done, total) => Number.isFinite(done) && total > 0 ? Math.round(done / total * 100) : null;
	const tone = (share, good, bad) => share == null ? null : share >= good ? "pos" : share < bad ? "neg" : "neutral";
	const shotShare = part(stats?.shots?.on, stats?.shots?.total);
	const passShare = part(accurate, passes);
	const duelShare = part(stats?.duels?.won, stats?.duels?.total);
	const dribbleShare = part(stats?.dribbles?.success, stats?.dribbles?.attempts);
	const facts = [
		["Minuten", stats?.games?.minutes],
		["Schoten", stats?.shots?.total, stats?.shots?.on != null ? `${stats.shots.on} op doel` : null, shotShare, tone(shotShare, 50, 34)],
		["Passes", passes, passShare != null ? `${passShare}% raak` : null, passShare, tone(passShare, 80, 65)],
		["Sleutelpasses", stats?.passes?.key],
		["Duels", stats?.duels?.total, stats?.duels?.won != null ? `${stats.duels.won} gewonnen` : null, duelShare, tone(duelShare, 55, 40)],
		["Dribbels", stats?.dribbles?.attempts, stats?.dribbles?.success != null ? `${stats.dribbles.success} geslaagd` : null, dribbleShare, tone(dribbleShare, 55, 40)],
		["Tackles", stats?.tackles?.total],
		["Onderscheppingen", stats?.tackles?.interceptions],
		["Reddingen", stats?.goals?.saves],
		["Overtredingen", stats?.fouls?.committed],
	].filter(([, value]) => Number.isFinite(value) && value > 0)
		.map(([label, value, note, share = null, tone = null]) => ({ label, value, note, share, tone }));
	return {
		id,
		name,
		short: shortName(name),
		number: player?.number ?? stats?.games?.number ?? "",
		position: player?.pos ?? stats?.games?.position ?? null,
		captain: Boolean(stats?.games?.captain),
		minutes: Number.isInteger(stats?.games?.minutes) ? stats.games.minutes : null,
		rating,
		ratingText: ratingText(rating),
		band: ratingBand(rating),
		facts,
	};
}

// Voor het veld: x en y in procenten van de eigen helft. De keeper staat
// achteraan (y 0), de spits voorin (y 100). Kolom 1 is de linkerflank.
function pitchTeam(match, side, names) {
	const teamId = match.teams?.[side]?.id;
	const lineup = match.lineups?.find(item => item.team?.id === teamId);
	if (!lineup) return null;
	const stats = match.players?.find(item => item.team?.id === teamId);
	const starters = lineup.startXI ?? [];
	const complete = starters.length === 11 && starters.every(item => /^\d+:\d+$/.test(item.player?.grid ?? ""));
	const lines = new Map();
	if (complete) {
		for (const { player } of starters) {
			const [row, col] = player.grid.split(":").map(Number);
			lines.set(row, Math.max(lines.get(row) ?? 0, col));
		}
	}
	const lastLine = Math.max(1, ...lines.keys());
	const events = (match.events ?? []).filter(event => event.team?.id === teamId);
	const goalsBy = (player) => events.filter(event => event.type === "Goal" && ["Normal Goal", "Penalty"].includes(event.detail) &&
		((player.id != null && event.player?.id === player.id) || event.player?.name === player.name)).map(event => minuteLabel(event.time));
	const assistsBy = (player) => events.filter(event => event.type === "Goal" && event.detail !== "Own Goal" &&
		player.id != null && event.assist?.id === player.id).map(event => minuteLabel(event.time));
	const cardsBy = (player, detail) => events.filter(event => event.type === "Card" && event.detail === detail &&
		((player.id != null && event.player?.id === player.id) || event.player?.name === player.name)).map(event => minuteLabel(event.time));
	const subOff = (player) => events.find(event => event.type === "subst" &&
		((player.id != null && event.player?.id === player.id) || event.player?.name === player.name));
	const subOn = (player) => events.find(event => event.type === "subst" &&
		((player.id != null && event.assist?.id === player.id) || event.assist?.name === player.name));

	const decorate = (player) => {
		const card = playerCard(player, playerStats(stats, player));
		const off = subOff(player);
		const on = subOn(player);
		return {
			...card,
			goals: goalsBy(player),
			assists: assistsBy(player),
			yellow: cardsBy(player, "Yellow Card"),
			red: cardsBy(player, "Red Card"),
			off: off ? minuteLabel(off.time) : null,
			offFor: off?.assist?.name ? shortName(off.assist.name) : null,
			on: on ? minuteLabel(on.time) : null,
			onFor: on?.player?.name ? shortName(on.player.name) : null,
		};
	};

	const players = starters.map(({ player }) => {
		const card = decorate(player);
		if (!complete) return { ...card, x: null, y: null };
		const [row, col] = player.grid.split(":").map(Number);
		const count = lines.get(row);
		return {
			...card,
			x: Math.round((col - 0.5) / count * 1000) / 10,
			y: lastLine === 1 ? 0 : Math.round((row - 1) / (lastLine - 1) * 1000) / 10,
		};
	});
	const bench = (lineup.substitutes ?? []).map(({ player }) => decorate(player)).filter(player => player.on);
	const formation = complete ? Array.from({ length: lastLine - 1 }, (_, index) =>
		starters.filter(({ player }) => Number(player.grid.split(":")[0]) === index + 2).length).join("-") : null;
	const rated = [...players, ...bench].filter(player => player.rating);
	const average = rated.length ? rated.reduce((sum, player) => sum + player.rating, 0) / rated.length : null;
	return {
		side,
		name: names[side],
		formation,
		coach: lineup.coach?.name ?? null,
		complete,
		players,
		bench,
		ratings: [...players, ...bench].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
		average: average ? ratingText(average) : null,
		averageBand: ratingBand(average),
	};
}

export function matchStory(wedstrijd) {
	const { data } = wedstrijd;
	const match = data.match;
	const side = data.home === "SC Cambuur" ? "home" : "away";
	const names = { home: data.home, away: data.away };
	const forGoals = data.score[side];
	const againstGoals = data.score[side === "home" ? "away" : "home"];
	const result = forGoals > againstGoals ? "winst" : forGoals < againstGoals ? "verlies" : "gelijk";
	const base = {
		side,
		result,
		resultLetter: { winst: "W", gelijk: "G", verlies: "V" }[result],
		opponent: side === "home" ? data.away : data.home,
		dateLabel: data.matchDate ? longDate.format(new Date(`${data.matchDate}T12:00:00Z`)).replaceAll(".", "") : null,
		halftime: null,
		axis: null,
		moments: [],
		goals: [],
		strip: [],
		stripTeams: { home: [], away: [] },
		played: null,
		playedText: null,
		facts: null,
		states: [],
		teamStats: null,
		pitch: [],
		motm: null,
	};
	if (!match) return base;
	// Gespeeld: 90 plus de blessuretijd. Die staat in fixture.status.extra;
	// ontbreekt die, dan het laatste moment na de 90e minuut. Geen moment ligt
	// in de opgeslagen data later dan status.extra.
	// Blessuretijd: fixture.status.extra, anders het laatste moment na 90′
	// (een ondergrens). Zonder beide is hij onbekend: "90′+".
	const lastMoment = Math.max(0, ...(match.events ?? []).map(event => minuteValue(event.time)));
	const fromApi = Number.isInteger(match.fixture?.status?.extra) ? match.fixture.status.extra : null;
	const added = Math.max(fromApi ?? 0, lastMoment - 90, 0);
	const addedKnown = fromApi !== null || lastMoment > 90;
	const last = 90 + added;
	// De as loopt tot de gespeelde minuten, zodat tijdlijn en klok gelijk eindigen.
	const length = last;
	const list = moments(match, names, length);
	const strip = stripMoments(list);
	const stripTeams = { home: strip.filter(item => item.displaySide === "home"), away: strip.filter(item => item.displaySide === "away") };
	const ht = match.score?.halftime;
	const pitch = ["home", "away"].map(team => pitchTeam(match, team, names)).filter(Boolean)
		.map(team => ({ ...team, cambuur: team.side === side }));
	const everyone = pitch.flatMap(team => team.ratings.map(player => ({ ...player, team: team.name, side: team.side })));
	const motm = everyone.reduce((best, player) => (player.rating ?? 0) > (best?.rating ?? 0) ? player : best, null);
	return {
		...base,
		halftime: Number.isInteger(ht?.home) && Number.isInteger(ht?.away) ? `${ht.home}–${ht.away}` : null,
		axis: {
			length,
			half: Math.round(45 / length * 10000) / 100,
			full: Math.round(90 / length * 10000) / 100,
			ticks: [0, 15, 30, 45, 60, 75, 90].map(value => ({ value, at: Math.round(value / length * 10000) / 100 })),
			// De blessuretijd als stuk na 90′: vanaf waar, en hoeveel minuten.
			added,
			addedFrom: Math.round(90 / length * 10000) / 100,
		},
		moments: list,
		goals: list.filter(item => item.goal),
		strip,
		stripTeams,
		played: last,
		// Zoals op de tijdlijn: 90′+4 bij vier minuten blessuretijd, 90′+ als
		// die onbekend is.
		playedText: added ? `90′+${added}` : addedKnown ? "90′" : "90′+",
		facts: matchFacts(match, side),
		states: scoreStates(list, side, length),
		teamStats: teamStats(match),
		pitch,
		motm,
	};
}

// Vorige en volgende wedstrijd in de collectie (op datum).
export function matchNeighbors(collection, wedstrijd) {
	const list = [...collection];
	const index = list.findIndex(item => item.data.matchUrl === wedstrijd.data.matchUrl);
	return {
		previous: index > 0 ? list[index - 1] : null,
		next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
	};
}
