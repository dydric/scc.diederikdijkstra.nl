import { access, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { sameTeamName } from "../../src/lib/scc-team-names.js";

const root = path.resolve("src/scc");
const apiBase = "https://v3.football.api-sports.io";
const cambuurId = 420;
const finishedStatuses = new Set(["FT", "AET", "PEN"]);

function fail(message) {
	throw new Error(message);
}

function fixtureId(value) {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== String(value)) {
		fail("Gebruik één positief numeriek fixture-ID.");
	}
	return id;
}

function seasonFolder(value) {
	if (!/^20\d{2}-20\d{2}$/.test(value) ||
		Number(value.slice(5)) !== Number(value.slice(0, 4)) + 1) {
		fail("Gebruik een seizoen als 2026-2027.");
	}
	return path.join(root, value);
}

async function exists(file) {
	try {
		await access(file);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}

function responseFixture(payload) {
	if (!payload || typeof payload !== "object" ||
		(payload.errors && Object.keys(payload.errors).length > 0) ||
		payload.results !== 1 || !Array.isArray(payload.response) ||
		payload.response.length !== 1 || !payload.response[0]?.fixture?.id) {
		fail("De API-respons bevat niet precies één geldige wedstrijd.");
	}
	return payload.response[0];
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

function frontMatter(source) {
	const found = source.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/);
	if (!found) fail("Het wedstrijdbestand heeft geen herkenbare YAML-frontmatter.");
	return { header: found[1], body: found[2] };
}

function field(header, name) {
	const line = header.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1];
	if (!line) return undefined;
	if (line.startsWith('"')) return JSON.parse(line);
	return line.trim();
}

function hasMatchdataId(header) {
	return /^\d+$/.test(field(header, "matchdata") ?? "");
}

function score(header) {
	const block = header.match(/^score:\s*\n((?:^[ \t]+.*\n?)*)/m)?.[1];
	if (!block) fail("De wedstrijd mist een thuis–uit-score in de front matter.");
	const home = Number(block.match(/^\s+home:\s*(\d+)\s*$/m)?.[1]);
	const away = Number(block.match(/^\s+away:\s*(\d+)\s*$/m)?.[1]);
	if (!Number.isInteger(home) || !Number.isInteger(away)) fail("Ongeldige thuis–uit-score.");
	return { home, away };
}

function validate(match, source, id, file) {
	const { header } = frontMatter(source);
	if (match.fixture.id !== id) fail("Het fixture-ID komt niet overeen met de API-respons.");
	const status = field(header, "matchdata");
	if (hasMatchdataId(header) || /^match:\s*$/m.test(header) ||
		/^fixtureId:/m.test(header)) {
		fail("Deze wedstrijd heeft al geïmporteerde data.");
	}
	if (status && status !== "pending" && status !== "null") fail("Onbekende matchdata-status.");

	const date = field(header, "date");
	const home = field(header, "home");
	const away = field(header, "away");
	const existingScore = score(header);
	if (localDate(match.fixture.date) !== date) {
		fail("De wedstrijddatum in de front matter wijkt af van de API.");
	}
	const season = path.basename(path.dirname(file));
	if (Number(season.slice(0, 4)) !== match.league?.season) {
		fail("Het API-seizoen komt niet overeen met de seizoensmap.");
	}
	if (!finishedStatuses.has(match.fixture.status?.short)) {
		fail("Importeer alleen een afgelopen wedstrijd.");
	}
	if ((home === "SC Cambuur") !== (match.teams?.home?.id === cambuurId) ||
		(away === "SC Cambuur") !== (match.teams?.away?.id === cambuurId)) {
		fail("Thuis- en uitploeg komen niet overeen met Cambuurs positie in de API.");
	}
	const opponent = home === "SC Cambuur" ? away : home;
	const apiOpponent = home === "SC Cambuur"
		? match.teams.away.name
		: match.teams.home.name;
	if (!sameTeamName(opponent, apiOpponent)) {
		fail("De tegenstander in het verslag wijkt af van de API-respons.");
	}
	if (existingScore.home !== match.goals?.home ||
		existingScore.away !== match.goals?.away) {
		fail("De uitslag in het verslag wijkt af van de API-respons.");
	}
	return { date, home, away, season, score: existingScore };
}

function linkedSource(source, id) {
	const { header, body } = frontMatter(source);
	const updated = /^matchdata:/m.test(header)
		? header.replace(/^matchdata:.*$/m, `matchdata: ${id}`)
		: `${header.trimEnd()}\nmatchdata: ${id}`;
	return `---\n${updated}\n---${body}`;
}

async function atomicWrite(file, content) {
	const temporary = `${file}.tmp-${process.pid}`;
	try {
		await writeFile(temporary, content, { flag: "wx" });
		await rename(temporary, file);
	} catch (error) {
		await unlink(temporary).catch(() => {});
		throw error;
	}
}

async function duplicateFixture(id, target) {
	for (const season of await readdir(root, { withFileTypes: true })) {
		if (!season.isDirectory() || !/^20\d{2}-20\d{2}$/.test(season.name)) continue;
		for (const name of await readdir(path.join(root, season.name))) {
			if (!name.endsWith(".md")) continue;
			const file = path.join(root, season.name, name);
			if (file === target) continue;
			const source = await readFile(file, "utf8");
			if (new RegExp(`^matchdata:\\s*${id}\\s*$`, "m").test(frontMatter(source).header)) {
				fail(`Fixture ${id} is al gekoppeld aan ${file}.`);
			}
		}
	}
}

async function fetchFixture(id, season) {
	const folder = seasonFolder(season);
	if (!await exists(folder)) fail(`Seizoensmap ontbreekt: ${folder}`);
	const file = path.join(root, "api", `${id}.json`);
	if (await exists(file)) fail(`Respons bestaat al: ${file}`);
	const key = process.env.API_FOOTBALL_KEY;
	if (!key) fail("API_FOOTBALL_KEY ontbreekt in de omgeving.");

	const response = await fetch(`${apiBase}/fixtures?id=${id}`, {
		headers: { "x-apisports-key": key },
	});
	if (!response.ok) fail(`API-Football antwoordde met HTTP ${response.status}.`);
	const payload = await response.json();
	const match = responseFixture(payload);
	if (match.fixture.id !== id) fail("De API gaf een ander fixture-ID terug.");
	if (!finishedStatuses.has(match.fixture.status?.short)) {
		fail("De wedstrijd is nog niet afgelopen; de respons wordt niet opgeslagen.");
	}
	if (match.league?.season !== Number(season.slice(0, 4)) ||
		![match.teams?.home?.id, match.teams?.away?.id].includes(cambuurId)) {
		fail("De API-wedstrijd hoort niet bij Cambuur in deze seizoensmap.");
	}
	const raw = JSON.stringify(payload, null, 2) + "\n";
	if (raw.includes(key)) fail("De respons bevat de API-sleutel en wordt niet opgeslagen.");
	await mkdir(path.dirname(file), { recursive: true });
	await writeFile(file, raw, { flag: "wx" });
	console.log(`Eén API-verzoek; respons opgeslagen in ${file}.`);
	console.log(`Resterende dagquota volgens API: ${response.headers.get("x-ratelimit-requests-remaining") ?? "onbekend"}.`);
}

async function linkFixture(fileName, jsonName, write) {
	const file = path.resolve(fileName);
	if (!file.startsWith(root + path.sep) || !file.endsWith(".md")) {
		fail("Het wedstrijdbestand moet een Markdown-bestand onder src/scc/ zijn.");
	}
	const source = await readFile(file, "utf8");
	const raw = await readFile(jsonName, "utf8");
	if (process.env.API_FOOTBALL_KEY && raw.includes(process.env.API_FOOTBALL_KEY)) {
		fail("De ruwe respons bevat de API-sleutel.");
	}
	const payload = JSON.parse(raw);
	const match = responseFixture(payload);
	const id = fixtureId(match.fixture.id);
	const expectedRaw = path.join(root, "api", `${id}.json`);
	if (path.resolve(jsonName) !== expectedRaw) {
		fail(`Bewaar de ruwe respons eerst als ${expectedRaw}.`);
	}
	const info = validate(match, source, id, file);
	await duplicateFixture(id, file);
	const next = linkedSource(source, id);
	const summary = {
		match: `${info.date} ${info.home} – ${info.away}`,
		fixtureId: id,
		events: match.events?.length ?? 0,
		lineups: match.lineups?.length ?? 0,
		teamStatistics: match.statistics?.length ?? 0,
	};
	console.log(JSON.stringify(summary, null, 2));
	if (!write) {
		console.log("Preview: geen bestand gewijzigd. Voeg --write toe om deze respons te koppelen.");
		return;
	}
	if (await readFile(file, "utf8") !== source) {
		fail("Het verslag is tijdens de import gewijzigd; probeer het opnieuw.");
	}
	await atomicWrite(file, next);
	console.log(`Gekoppeld in ${file}.`);
}

async function guidedImport() {
	const { pendingMatches, discoverH2h, readPlan, importSeason } =
		await import("./scc-matchdata-import.mjs");
	const pending = await pendingMatches();
	if (pending.length === 0) {
		console.log("Alle Cambuur-wedstrijden hebben al matchdata. Geen API-verzoek.");
		return;
	}
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		fail("Start npm run scc:matchdata in een interactieve terminal om de import te bevestigen.");
	}
	if (!process.env.API_FOOTBALL_KEY) fail("API_FOOTBALL_KEY ontbreekt in .env.");
	const seasons = [...new Set(pending.map(row => row.season))];
	const input = createInterface({ input: process.stdin, output: process.stdout });
	let season = seasons[0];
	try {
		if (seasons.length > 1) {
			console.log("Ontbrekende wedstrijddata per seizoen:");
			seasons.forEach((value, index) => {
				console.log(`  ${index + 1}. ${value}: ${pending.filter(row => row.season === value).length}`);
			});
			const answer = (await input.question("Welk seizoen? [1]: ")).trim();
			const choice = answer === "" ? 1 : Number(answer);
			if (!Number.isInteger(choice) || choice < 1 || choice > seasons.length) {
				console.log("Geen geldig seizoen gekozen. Er is niets opgehaald.");
				return;
			}
			season = seasons[choice - 1];
		}
		const selected = pending.filter(row => row.season === season);
		const opponents = new Set(selected.map(row => row.opponent));
		const maximum = 1 + opponents.size + selected.length;
		console.log(`\n${selected.length} wedstrijd(en) zonder matchdata in ${season}:`);
		for (const row of selected) console.log(`  ${row.date}  ${row.home} – ${row.away}  (${row.name})`);
		console.log(`Maximaal ${maximum} API-verzoeken: eventueel 1 teamlijst, ${opponents.size} tegenstanders en ${selected.length} wedstrijd(en).`);
		if (maximum > 95) {
			fail("Deze reeks kan de Free-dagquota overschrijden. Verdeel de import in kleinere delen.");
		}
		const answer = (await input.question("Deze wedstrijden ophalen en koppelen? [j/N]: ")).trim().toLowerCase();
		if (answer !== "j" && answer !== "ja") {
			console.log("Import geannuleerd. Geen API-verzoek.");
			return;
		}
	} finally {
		input.close();
	}
	await discoverH2h(season, null, true);
	const plan = await readPlan(season);
	if (plan.issues.length || plan.rows.length !== pending.filter(row => row.season === season).length) {
		for (const issue of plan.issues) console.error(`CONTROLE NODIG: ${issue}`);
		fail("Niet alle wedstrijden passen eenduidig. Er is geen nieuwe wedstrijd-JSON opgehaald of gekoppeld.");
	}
	console.log(`\n${plan.rows.length} wedstrijd(en) gecontroleerd; volledige data wordt opgehaald.`);
	await importSeason(season, null, true);
}

async function main(args) {
	const [command, ...rest] = args;
	if (command === "preview" && !rest.length) {
		await (await import("./scc-preview.mjs")).importPreview();
		return;
	}
	if (!command) {
		await guidedImport();
		return;
	}
	if (command === "fetch" && rest.length === 2) {
		await fetchFixture(fixtureId(rest[0]), rest[1]);
		return;
	}
	if (command === "link" && (rest.length === 2 || rest.length === 3)) {
		if (rest.length === 3 && rest[2] !== "--write") fail("Onbekende optie.");
		await linkFixture(rest[0], rest[1], rest[2] === "--write");
		return;
	}
	fail("Gebruik: scc-matchdata.mjs [zonder argumenten] | preview | fetch <fixture-id> <seizoen> | link <wedstrijd.md> <respons.json> [--write]");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
	main(process.argv.slice(2)).catch(error => {
		console.error(error.message);
		process.exitCode = 1;
	});
}

export { atomicWrite, exists, field, frontMatter, hasMatchdataId, linkedSource, localDate, responseFixture, score, validate };
