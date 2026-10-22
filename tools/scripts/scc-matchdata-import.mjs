import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
	atomicWrite,
	exists,
	field,
	frontMatter,
	hasMatchdataId,
	linkedSource,
	localDate,
	responseFixture,
	score,
	validate,
} from "./scc-matchdata.mjs";

const root = path.resolve("src/scc");
const api = path.join(root, "api");
const discovery = path.join(os.tmpdir(), "diederik-scc-matchdata");
const teamId = 420;
let lastRemaining = null;
let lastRequestAt = 0;

function fail(message) {
	throw new Error(message);
}

function seasonYear(season) {
	if (!/^20\d{2}-20\d{2}$/.test(season) ||
		Number(season.slice(5)) !== Number(season.slice(0, 4)) + 1) {
		fail("Gebruik een seizoen als 2026-2027.");
	}
	return Number(season.slice(0, 4));
}

function listFile(season) {
	return path.join(discovery, `fixtures-${teamId}-${seasonYear(season)}.json`);
}

function checkResponse(payload) {
	if (!payload || typeof payload !== "object" ||
		(payload.errors && Object.keys(payload.errors).length > 0) ||
		!Array.isArray(payload.response) || payload.results !== payload.response.length ||
		payload.paging?.total > 1) {
		fail("De API-respons is ongeldig, bevat fouten of heeft meer dan één pagina.");
	}
	return payload.response;
}

async function request(url) {
	if (lastRemaining !== null && lastRemaining < 5) {
		fail("Minder dan vijf verzoeken over; verdere API-calls worden overgeslagen.");
	}
	const pause = 6500 - (Date.now() - lastRequestAt);
	if (pause > 0) await new Promise(resolve => setTimeout(resolve, pause));
	const key = process.env.API_FOOTBALL_KEY;
	if (!key) fail("API_FOOTBALL_KEY ontbreekt in .env.");
	lastRequestAt = Date.now();
	const response = await fetch(url, { headers: { "x-apisports-key": key } });
	if (!response.ok) fail(`API-Football antwoordde met HTTP ${response.status}.`);
	const raw = await response.text();
	if (raw.includes(key)) fail("De API-respons bevat de sleutel en wordt niet opgeslagen.");
	const remaining = response.headers.get("x-ratelimit-requests-remaining");
	console.log(`Eén API-verzoek; resterende dagquota: ${remaining ?? "onbekend"}.`);
	lastRemaining = remaining === null ? null : Number(remaining);
	return JSON.parse(raw);
}

function normalized(value) {
	return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
		.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const opponentAliases = {
	"FC Twente": "Twente",
	"NEC": "NEC Nijmegen",
	"FC Den Bosch": "Den Bosch",
	"FC Dordrecht": "Dordrecht",
	"FC Emmen": "Emmen",
	"Jong FC Utrecht": "Jong Utrecht",
	"Jong Ajax": "Jong Ajax",
	"Jong PSV": "Jong PSV U21",
	"Jong AZ": "Jong AZ",
	"MVV Maastricht": "MVV",
	"RKC Waalwijk": "Waalwijk",
	"Roda JC": "Roda",
	"TOP Oss": "FC OSS",
	"VVV-Venlo": "VVV Venlo",
};

async function discoverH2h(season, limit = null, refresh = false) {
	seasonYear(season);
	const folder = path.join(root, season);
	if (!await exists(folder)) fail(`Seizoensmap ${season} ontbreekt.`);
	const files = await Promise.all((await readdir(folder))
		.filter(name => name.endsWith(".md"))
		.map(async name => [name, await readFile(matchFile(season, name), "utf8")]));
	const opponents = new Set();
	for (const [, source] of files) {
		const header = frontMatter(source).header;
		if (hasMatchdataId(header)) continue;
		const home = field(header, "home");
		const away = field(header, "away");
		if (home !== "SC Cambuur" && away !== "SC Cambuur") fail("Wedstrijd zonder SC Cambuur in de front matter.");
		opponents.add(home === "SC Cambuur" ? away : home);
	}
	if (opponents.size === 0) {
		console.log(`Alle verslagen van ${season} zijn al gekoppeld. Geen API-verzoek.`);
		return;
	}
	const teamFile = path.join(discovery, "teams-netherlands.json");
	let teamsPayload;
	if (await exists(teamFile)) {
		teamsPayload = JSON.parse(await readFile(teamFile, "utf8"));
	} else {
		const url = new URL("https://v3.football.api-sports.io/teams");
		url.search = new URLSearchParams({ country: "Netherlands" }).toString();
		teamsPayload = await request(url);
		checkResponse(teamsPayload);
		await mkdir(path.dirname(teamFile), { recursive: true });
		await writeFile(teamFile, JSON.stringify(teamsPayload, null, 2) + "\n", { flag: "wx" });
	}
	const teams = checkResponse(teamsPayload);
	const mapped = [];
	for (const opponent of [...opponents].sort()) {
		const name = opponentAliases[opponent] ?? opponent;
		const candidates = teams.filter(item => normalized(item.team?.name ?? "") === normalized(name));
		if (candidates.length !== 1) fail(`${opponent}: ${candidates.length} teams met naam ${name}. Pas de alias handmatig aan.`);
		mapped.push({ opponent, id: candidates[0].team.id });
	}
	const selected = mapped.slice(0, limit ?? undefined);
	console.log(`${mapped.length} tegenstanders; ${selected.length} geselecteerd; maximaal ${selected.length} aanvullende API-verzoeken voor de ontdekking.`);
	const saved = listFile(season);
	await mkdir(discovery, { recursive: true });
	const fixtures = new Map();
	if (await exists(saved)) {
		const previous = JSON.parse(await readFile(saved, "utf8"));
		for (const match of checkResponse(previous)) fixtures.set(match.fixture.id, match);
	}
	for (const { opponent, id } of selected) {
		const file = path.join(discovery, `h2h-${teamId}-${id}.json`);
		let payload;
		if (await exists(file) && !refresh) {
			payload = JSON.parse(await readFile(file, "utf8"));
			console.log(`Cache: ${opponent}.`);
		} else {
			const url = new URL("https://v3.football.api-sports.io/fixtures/headtohead");
			url.search = new URLSearchParams({ h2h: `${teamId}-${id}` }).toString();
			payload = await request(url);
			checkResponse(payload);
			if (await exists(file)) {
				await atomicWrite(file, JSON.stringify(payload, null, 2) + "\n");
			} else {
				await writeFile(file, JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
			}
			console.log(`Opgeslagen: ${opponent}.`);
		}
		for (const match of checkResponse(payload)) {
			if (match.league?.season === seasonYear(season) &&
				[match.teams?.home?.id, match.teams?.away?.id].includes(teamId)) {
				fixtures.set(match.fixture.id, match);
			}
		}
	}
	const list = [...fixtures.values()];
	if (limit === null) {
		const raw = JSON.stringify({
			get: "fixtures/headtohead", parameters: { team: String(teamId), season },
			errors: [], results: list.length, paging: { current: 1, total: 1 }, response: list,
		}, null, 2) + "\n";
		if (await exists(saved)) await atomicWrite(saved, raw);
		else await writeFile(saved, raw, { flag: "wx" });
		console.log(`${list.length} fixtures verzameld in ${saved}.`);
	}
	const plan = planMatches(season, files, list);
	for (const row of plan.rows) console.log(`${row.name} → ${row.match.fixture.id}`);
	for (const issue of plan.issues) console.error(`CONTROLE NODIG: ${issue}`);
	console.log(`${plan.rows.length} passend; ${plan.issues.length} nog te controleren.`);
	if (plan.issues.length) process.exitCode = 1;
}

async function discover(season) {
	const year = seasonYear(season);
	if (!await exists(path.join(root, season))) fail(`Seizoensmap ${season} ontbreekt.`);
	const file = listFile(season);
	if (await exists(file)) {
		console.log(`Wedstrijdlijst bestaat al: ${file}. Geen API-verzoek.`);
		return;
	}
	const recentFile = path.join(discovery, `fixtures-${teamId}-last-99.json`);
	let payload;
	if (await exists(recentFile)) {
		payload = JSON.parse(await readFile(recentFile, "utf8"));
		console.log(`Opgeslagen recente wedstrijden hergebruikt: ${recentFile}.`);
	} else {
		const url = new URL("https://v3.football.api-sports.io/fixtures");
		url.search = new URLSearchParams({ team: String(teamId), last: "99" }).toString();
		payload = await request(url);
		try {
			checkResponse(payload);
		} catch (error) {
			const diagnostic = path.join("/private/tmp", "scc-fixtures-recent-diagnostic.json");
			await writeFile(diagnostic, JSON.stringify(payload, null, 2) + "\n");
			fail(`${error.message} Respons bewaard voor controle in ${diagnostic}.`);
		}
		await mkdir(discovery, { recursive: true });
		await writeFile(recentFile, JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
	}
	const fixtures = checkResponse(payload).filter(match =>
		match.league?.season === year &&
		[match.teams?.home?.id, match.teams?.away?.id].includes(teamId));
	if (fixtures.length === 0) fail(`Geen wedstrijden van ${season} in de recente API-respons.`);
	await writeFile(file, JSON.stringify({
		get: "fixtures",
		parameters: { team: String(teamId), season: String(year), source: "recent" },
		errors: [],
		results: fixtures.length,
		paging: { current: 1, total: 1 },
		response: fixtures,
	}, null, 2) + "\n", { flag: "wx" });
	console.log(`${fixtures.length} fixtures voor ${season} verzameld in ${file}.`);
}

function matchFile(season, name) {
	return path.join(root, season, name);
}

export function planMatches(season, files, fixtures) {
	const year = seasonYear(season);
	const rows = [];
	const issues = [];
	const linked = new Set();
	for (const [name, source] of files) {
		const header = frontMatter(source).header;
		const status = field(header, "matchdata");
		if (hasMatchdataId(header)) {
			linked.add(Number(status));
			continue;
		}
		const date = field(header, "date");
		const file = matchFile(season, name);
		const candidates = fixtures.filter(match =>
			match.league?.season === year && localDate(match.fixture?.date) === date);
		const valid = candidates.filter(match => {
			try {
				validate(match, source, match.fixture.id, file);
				return true;
			} catch {
				return false;
			}
		});
		if (valid.length !== 1) {
			issues.push(`${name}: ${valid.length} passende fixtures; ${candidates.length} op ${date ?? "onbekende datum"}.`);
			continue;
		}
		rows.push({ name, file, source, match: valid[0] });
	}
	const seen = new Set(linked);
	for (const row of rows) {
		const id = row.match.fixture.id;
		if (seen.has(id)) issues.push(`${row.name}: fixture ${id} is al aan een andere wedstrijd gekoppeld.`);
		seen.add(id);
	}
	rows.sort((a, b) => a.name.localeCompare(b.name));
	return { rows, issues, linked: linked.size };
}

async function readPlan(season) {
	seasonYear(season);
	const saved = listFile(season);
	const folder = path.join(root, season);
	const files = await Promise.all((await readdir(folder))
		.filter(name => name.endsWith(".md"))
		.map(async name => [name, await readFile(matchFile(season, name), "utf8")]));
	if (!await exists(saved)) {
		const linked = files.every(([, source]) => hasMatchdataId(frontMatter(source).header));
		if (linked) return planMatches(season, files, []);
		fail(`Tijdelijke wedstrijdlijst ontbreekt. Voer eerst discover-h2h ${season} uit.`);
	}
	const fixtures = checkResponse(JSON.parse(await readFile(saved, "utf8")));
	return planMatches(season, files, fixtures);
}

async function showPlan(season) {
	const plan = await readPlan(season);
	for (const row of plan.rows) {
		const id = row.match.fixture.id;
		console.log(`${row.name} → ${id}${await exists(path.join(api, `${id}.json`)) ? " (JSON bestaat al)" : ""}`);
	}
	for (const issue of plan.issues) console.error(`CONTROLE NODIG: ${issue}`);
	console.log(`${plan.linked} al gekoppeld, ${plan.rows.length} passend, ${plan.issues.length} te controleren.`);
	if (plan.issues.length) process.exitCode = 1;
}

function batchPayload(match, batchName) {
	return {
		get: "fixtures",
		parameters: { id: String(match.fixture.id) },
		errors: [],
		results: 1,
		paging: { current: 1, total: 1 },
		response: [match],
		_meta: { sourceBatch: `batches/${batchName}` },
	};
}

async function importRows(rows, suppliedPayload = null) {
	for (let index = 0; index < rows.length; index += 20) {
		const group = rows.slice(index, index + 20);
		const ids = group.map(row => row.match.fixture.id);
		const batchName = `ids-${ids.join("-")}.json`;
		const batchFile = path.join(api, "batches", batchName);
		let payload;
		if (await exists(batchFile)) {
			payload = JSON.parse(await readFile(batchFile, "utf8"));
			console.log(`Bestaande batch hergebruikt: ${batchName}.`);
		} else if (suppliedPayload && index === 0) {
			payload = suppliedPayload;
		} else {
			const url = new URL("https://v3.football.api-sports.io/fixtures");
			url.search = new URLSearchParams({ ids: ids.join("-") }).toString();
			payload = await request(url);
		}
		const matches = checkResponse(payload);
		if (matches.length !== ids.length ||
			new Set(matches.map(match => match.fixture?.id)).size !== ids.length ||
			matches.some(match => !ids.includes(match.fixture.id))) {
			fail(`Batch ${batchName} bevat niet precies de gevraagde fixtures.`);
		}
		const byId = new Map(matches.map(match => [match.fixture.id, match]));
		for (const row of group) {
			const source = await readFile(row.file, "utf8");
			if (source !== row.source) fail(`${row.name} is sinds het koppelplan gewijzigd.`);
			validate(byId.get(row.match.fixture.id), source, row.match.fixture.id, row.file);
		}
		if (!await exists(batchFile)) {
			await mkdir(path.dirname(batchFile), { recursive: true });
			await writeFile(batchFile, JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
		}
		for (const row of group) {
			const id = row.match.fixture.id;
			const file = path.join(api, `${id}.json`);
			if (!await exists(file)) {
				await writeFile(file, JSON.stringify(batchPayload(byId.get(id), batchName), null, 2) + "\n", { flag: "wx" });
			}
			await atomicWrite(row.file, linkedSource(row.source, id));
			console.log(`Gekoppeld: ${row.name} → ${id}.`);
		}
	}
}

async function importIndividually(rows) {
	for (const row of rows) {
		const id = row.match.fixture.id;
		const file = path.join(api, `${id}.json`);
		const source = await readFile(row.file, "utf8");
		if (source !== row.source) fail(`${row.name} is sinds het koppelplan gewijzigd.`);
		let payload;
		if (await exists(file)) {
			payload = JSON.parse(await readFile(file, "utf8"));
			console.log(`Bestaande JSON hergebruikt: ${id}.`);
		} else {
			const url = new URL("https://v3.football.api-sports.io/fixtures");
			url.search = new URLSearchParams({ id: String(id) }).toString();
			payload = await request(url);
		}
		const match = responseFixture(payload);
		validate(match, source, id, row.file);
		if (!await exists(file)) {
			await writeFile(file, JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
		}
		await atomicWrite(row.file, linkedSource(source, id));
		console.log(`Gekoppeld: ${row.name} → ${id}.`);
	}
}

async function importIds(season, values) {
	seasonYear(season);
	const folder = path.join(root, season);
	if (!await exists(folder)) fail(`Seizoensmap ${season} ontbreekt.`);
	if (values.length < 1 || values.length > 20 ||
		values.some(value => !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))) {
		fail("Geef 1 tot 20 positieve fixture-ID's op.");
	}
	const ids = values.map(Number);
	if (new Set(ids).size !== ids.length) fail("Dubbele fixture-ID's opgegeven.");
	for (const id of ids) {
		if (await exists(path.join(api, `${id}.json`))) {
			fail(`Fixture ${id} staat al lokaal. Koppel die met scc:matchdata link.`);
		}
	}
	const url = new URL("https://v3.football.api-sports.io/fixtures");
	url.search = new URLSearchParams({ ids: ids.join("-") }).toString();
	const payload = await request(url);
	const fixtures = checkResponse(payload);
	if (fixtures.length !== ids.length ||
		new Set(fixtures.map(match => match.fixture?.id)).size !== ids.length ||
		fixtures.some(match => !ids.includes(match.fixture.id))) {
		fail("De API gaf niet precies de opgegeven fixture-ID's terug; er is niets gewijzigd.");
	}
	const files = await Promise.all((await readdir(folder))
		.filter(name => name.endsWith(".md"))
		.map(async name => [name, await readFile(matchFile(season, name), "utf8")]));
	const plan = planMatches(season, files, fixtures);
	const matched = new Set(plan.rows.map(row => row.match.fixture.id));
	if (plan.rows.length !== ids.length || ids.some(id => !matched.has(id)) ||
		plan.issues.some(issue => issue.includes("is al aan een andere wedstrijd gekoppeld"))) {
		for (const issue of plan.issues) console.error(`CONTROLE NODIG: ${issue}`);
		fail("Niet elk fixture-ID past bij precies één vrij wedstrijdbestand; er is niets gewijzigd.");
	}
	await importRows(plan.rows, payload);
}

async function restoreFromBatches(rows) {
	const folder = path.join(api, "batches");
	if (!await exists(folder)) return;
	const needed = new Map(rows.map(row => [row.match.fixture.id, row]));
	for (const name of await readdir(folder)) {
		if (!name.endsWith(".json")) continue;
		const payload = JSON.parse(await readFile(path.join(folder, name), "utf8"));
		for (const match of checkResponse(payload)) {
			const row = needed.get(match.fixture?.id);
			if (!row) continue;
			validate(match, row.source, match.fixture.id, row.file);
			const file = path.join(api, `${match.fixture.id}.json`);
			if (!await exists(file)) {
				await writeFile(file, JSON.stringify(batchPayload(match, name), null, 2) + "\n", { flag: "wx" });
			}
			needed.delete(match.fixture.id);
		}
		if (needed.size === 0) return;
	}
}

async function importSeason(season, limit, individual = true) {
	const plan = await readPlan(season);
	if (plan.issues.length && limit === null) {
		for (const issue of plan.issues) console.error(`CONTROLE NODIG: ${issue}`);
		fail("Koppelplan heeft afwijkingen. Gebruik --limit voor een gecontroleerde deelimport.");
	}
	const selected = plan.rows.slice(0, limit ?? undefined);
	if (selected.length === 0) {
		console.log("Geen ontbrekende wedstrijden om te koppelen.");
		return;
	}
	console.log(`${selected.length} wedstrijden geselecteerd; maximaal ${individual ? selected.length : Math.ceil(selected.length / 20)} detailverzoeken.`);
	await restoreFromBatches(selected);
	const cached = [];
	const missing = [];
	for (const row of selected) {
		const file = path.join(api, `${row.match.fixture.id}.json`);
		(await exists(file) ? cached : missing).push(row);
	}
	for (const row of cached) {
		const file = path.join(api, `${row.match.fixture.id}.json`);
		const source = await readFile(row.file, "utf8");
		if (source !== row.source) fail(`${row.name} is sinds het koppelplan gewijzigd.`);
		const match = responseFixture(JSON.parse(await readFile(file, "utf8")));
		validate(match, source, row.match.fixture.id, row.file);
		await atomicWrite(row.file, linkedSource(source, row.match.fixture.id));
		console.log(`Bestaande JSON gekoppeld: ${row.name} → ${row.match.fixture.id}.`);
	}
	if (individual) await importIndividually(missing);
	else await importRows(missing);
}

export async function pendingMatches() {
	const rows = [];
	for (const season of await readdir(root, { withFileTypes: true })) {
		if (!season.isDirectory() || !/^20\d{2}-20\d{2}$/.test(season.name)) continue;
		for (const name of await readdir(path.join(root, season.name))) {
			if (!name.endsWith(".md")) continue;
			const source = await readFile(matchFile(season.name, name), "utf8");
			const header = frontMatter(source).header;
			const status = field(header, "matchdata");
			if (hasMatchdataId(header)) continue;
			if (status && status !== "pending" && status !== "null") {
				fail(`${name}: onbekende matchdata-status.`);
			}
			const date = field(header, "date");
			if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
				fail(`${name}: ongeldige wedstrijddatum.`);
			}
			score(header);
			const home = field(header, "home");
			const away = field(header, "away");
			if ((home !== "SC Cambuur" && away !== "SC Cambuur") || !home || !away) {
				fail(`${name}: SC Cambuur ontbreekt als thuis- of uitploeg.`);
			}
			rows.push({ season: season.name, name, date, home, away,
				opponent: home === "SC Cambuur" ? away : home });
		}
	}
	return rows.sort((a, b) => b.season.localeCompare(a.season) || a.date.localeCompare(b.date));
}

async function main(args) {
	const [command, season, ...options] = args;
	if (command === "discover-h2h" && season) {
		const refresh = options.includes("--refresh");
		const rest = options.filter(option => option !== "--refresh");
		if (rest.length === 0) return discoverH2h(season, null, refresh);
		if (rest.length === 2 && rest[0] === "--limit" && /^[1-9]\d*$/.test(rest[1])) {
			return discoverH2h(season, Number(rest[1]), refresh);
		}
	}
	if (command === "discover" && season) {
		if (options.length === 0) return discover(season);
	}
	if (command === "plan" && season && options.length === 0) return showPlan(season);
	if (command === "import-ids" && season && options[0] === "--write") {
		return importIds(season, options.slice(1));
	}
	if (command === "import" && season && options.includes("--write")) {
		if (options.includes("--individual") && options.includes("--combined")) {
			fail("Kies --individual of --combined.");
		}
		const individual = !options.includes("--combined");
		const rest = options.filter(option => !["--write", "--individual", "--combined"].includes(option));
		let limit = null;
		if (rest.length === 2 && rest[0] === "--limit" && /^[1-9]\d*$/.test(rest[1])) {
			limit = Number(rest[1]);
		} else if (rest.length !== 0) {
			fail("Gebruik --limit <positief aantal> na --write.");
		}
		return importSeason(season, limit, individual);
	}
	fail("Gebruik: discover-h2h <seizoen> [--refresh] [--limit N] | plan <seizoen> | import <seizoen> --write [--limit N] | import-ids <seizoen> --write <id> [id ...]");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
	main(process.argv.slice(2)).catch(error => {
		console.error(error.message);
		process.exitCode = 1;
	});
}

export { discoverH2h, importSeason, readPlan };
