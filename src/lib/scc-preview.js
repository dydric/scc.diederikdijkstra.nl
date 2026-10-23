const DAY = 86400000;
export const previewKey = row => `${row.date}|${row.home}|${row.away}`;
export const seasonFor = row => Number(row.date.slice(0, 4)) - (Number(row.date.slice(5, 7)) < 7 ? 1 : 0);
const validNumber = value => Number.isInteger(value) && value >= 0;
// Exacte aliassen voorkomen dat PSV aan Jong PSV of Utrecht aan Jong Utrecht koppelt.
function sameTeamName(left, right) {
	const normalize = value => {
		const name = String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
			.toLowerCase().replace(/^(sc |fc |vv )/, "").replace(/[^a-z0-9]/g, "");
		return ({ azalkmaar: "az", necnijmegen: "nec", excelsiorrotterdam: "excelsior", psveindhoven: "psv" })[name] ?? name;
	};
	return Boolean(left && right) && normalize(left) === normalize(right);
}
const teamByName = (teams, name) => {
	const found = teams.filter(team => sameTeamName(name, team.name));
	return found.length === 1 ? found[0] : null;
};

export function readStandings(rows, season) {
	const league = rows.find(row => row.league?.id === 88 && row.league.season === season)?.league;
	const table = league?.standings?.[0];
	if (!table?.length || !table.some(row => row.team?.id === 420) ||
		table.some(row => !validNumber(row.rank) || row.rank < 1 || !Number.isInteger(row.points) ||
			!validNumber(row.all?.played) || !validNumber(row.team?.id) || typeof row.team.name !== "string") ||
		new Set(table.map(row => row.team.id)).size !== table.length) throw new Error("Ongeldige ranglijst.");
	return table.map(row => ({ id: row.team.id, name: row.team.name, rank: row.rank,
		points: row.points, played: row.all.played, form: readForm(row.form) }));
}

// De vormreeks wordt altijd oud naar nieuw getoond, met maximaal vijf duels.
export function readForm(value) {
	return typeof value === "string" && /^[WDL]+$/.test(value) ? value.slice(-5) : "";
}

export function readPrediction(rows, fixture) {
	const row = rows[0];
	if (rows.length !== 1 || row?.teams?.home?.id !== fixture.homeId || row?.teams?.away?.id !== fixture.awayId) {
		throw new Error("Voorspelling hoort niet bij de gecontroleerde ploegen.");
	}
	const percent = {};
	for (const side of ["home", "draw", "away"]) {
		const value = row.predictions?.percent?.[side];
		if (typeof value !== "string" || !/^\d+(?:\.\d+)?%$/.test(value)) throw new Error("Geen volledige voorspelling.");
		percent[side] = Number(value.slice(0, -1));
		if (percent[side] > 100) throw new Error("Ongeldig percentage.");
	}
	if (Math.abs(Object.values(percent).reduce((a, b) => a + b, 0) - 100) > 1) throw new Error("Percentages vormen geen volledige verdeling.");
	return { percent, forms: Object.fromEntries(["home", "away"].map(side =>
		[side, readForm(row.teams[side].league?.form)])) };
}

export function matchFixture(rows, upcoming) {
	const matches = rows.filter(row => row.fixture?.status?.short === "NS" &&
		Date.parse(row.fixture.date) === Date.parse(upcoming.date) && row.league?.season === seasonFor(upcoming) &&
		(upcoming.competition !== "Eredivisie" || row.league.id === 88) &&
		sameTeamName(upcoming.home, row.teams?.home?.name) && sameTeamName(upcoming.away, row.teams?.away?.name) &&
		(row.teams.home.id === 420 || row.teams.away.id === 420));
	if (matches.length !== 1 || !validNumber(matches[0].fixture.id)) throw new Error("Geen eenduidige toekomstige fixture voor datum en ploegen.");
	const match = matches[0];
	return { id: match.fixture.id, homeId: match.teams.home.id, awayId: match.teams.away.id };
}

export async function refreshPreview({ snapshot = {}, fixtures, teams = [], api, now = new Date() }) {
	const next = structuredClone(snapshot);
	next.checkedAt = now.toISOString();
	next.resources ??= {};
	next.teams ??= teams;
	const first = fixtures.find(row => Date.parse(row.date) > now.getTime());
	if (!first) return next;
	const season = seasonFor(first);
	const update = async (key, operation) => {
		const previous = next.resources[key];
		if (Date.parse(previous?.retryAt) > now.getTime()) return;
		try {
			const data = await operation();
				next.resources[key] = { data, fetchedAt: now.toISOString(), retryAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString() };
		} catch (error) {
			next.resources[key] = { ...previous, status: error.blocked ? "blocked" : "unavailable",
				retryAt: new Date(now.getTime() + (error.blocked ? 7 : 1) * DAY).toISOString() };
		}
	};
	await update(`standings-${season}`, async () => readStandings(await api.get("standings", { league: 88, season }), season));
	const table = next.resources[`standings-${season}`]?.data ?? [];
	for (const team of table) if (!next.teams.some(item => item.id === team.id)) next.teams.push({ id: team.id, name: team.name });
	const key = previewKey(first);
	await update(`prediction-${key}`, async () => {
		if (!next.fixture || next.fixture.key !== key) {
			const opponentName = first.home === "SC Cambuur" ? first.away : first.home;
			let opponent = teamByName(next.teams, opponentName);
			if (!opponent) {
				const rows = await api.get("teams", { search: opponentName.replace(/^(SC |FC |VV )/i, "") });
				opponent = teamByName(rows.filter(row => row.team?.country === "Netherlands").map(row => row.team), opponentName);
				if (!opponent) throw new Error("Geen eenduidige tegenstander.");
				next.teams.push({ id: opponent.id, name: opponent.name });
			}
			next.fixture = { ...matchFixture(await api.get("fixtures/headtohead", { h2h: `420-${opponent.id}` }), first), key };
		}
		return readPrediction(await api.get("predictions", { fixture: next.fixture.id }), next.fixture);
	});
	// Bewaar alleen de huidige voorspelling; oude voorspellingen zijn geen archief.
	for (const name of Object.keys(next.resources)) {
		if (name.startsWith("prediction-") && name !== `prediction-${key}`) delete next.resources[name];
	}
	return next;
}

// De API rekent in stappen van 5% en geeft vaak 0/50/50. Op de site wijkt
// elke uitkomst daarom een paar procent af, vast per wedstrijd: dezelfde
// sleutel geeft bij elke build en verversing dezelfde verdeling. Thuis en
// uit schuiven elk -3 t/m +3, gelijk vangt het verschil op. Daarna krijgt
// elk vlak minimaal 5%, afgesnoept van het grootste, en is de som 100.
const PREDICTION_MIN = 5;
export function displayPrediction(percent, key) {
	let seed = [...key].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
	const shift = () => {
		seed = (seed + 0x6d2b79f5) >>> 0;
		let value = Math.imul(seed ^ (seed >>> 15), seed | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) % 7 - 3;
	};
	const home = Math.round(percent.home) + shift();
	const away = Math.round(percent.away) + shift();
	const value = { home, draw: 100 - home - away, away };
	const sides = ["home", "draw", "away"];
	for (const side of sides) value[side] = Math.max(PREDICTION_MIN, value[side]);
	const largest = () => sides.reduce((top, side) => value[side] > value[top] ? side : top);
	for (let total = sides.reduce((sum, side) => sum + value[side], 0); total !== 100; total += total > 100 ? -1 : 1) {
		value[largest()] += total > 100 ? -1 : 1;
	}
	return value;
}

export function previewRows(rows, snapshot = {}, now = new Date()) {
	const updated = value => value ? new Intl.DateTimeFormat("nl-NL", {
		timeZone: "Europe/Amsterdam", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
	}).format(new Date(value)) : "";
	return rows.map(row => {
		const standings = row.competition === "Eredivisie" ? snapshot.resources?.[`standings-${seasonFor(row)}`] : null;
		const prediction = Date.parse(row.date) > now.getTime() ? snapshot.resources?.[`prediction-${previewKey(row)}`] : null;
		const team = side => {
			const found = teamByName(standings?.data ?? [], row[side]);
			return { rank: found?.rank ?? null, points: found?.points ?? null, played: found?.played ?? null,
				form: found?.form || prediction?.data?.forms?.[side] || "" };
		};
		return { ...row, preview: { home: team("home"), away: team("away"),
			standingsAt: standings?.data ? standings.fetchedAt : null,
			standingsUpdated: standings?.data ? updated(standings.fetchedAt) : "",
			prediction: prediction?.data?.percent ? displayPrediction(prediction.data.percent, previewKey(row)) : null, predictionAt: prediction?.data ? prediction.fetchedAt : null,
			predictionUpdated: prediction?.data ? updated(prediction.fetchedAt) : "" } };
	});
}
