import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchResults, teamKey } from "../../src/lib/scc-results.js";
import { amsterdamDay } from "../../src/lib/scc-upcoming.js";

const root = fileURLToPath(new URL("../../src/scc/", import.meta.url));

export function seasonFor(date) {
	const year = Number(date.slice(0, 4));
	const start = Number(date.slice(5, 7)) >= 7 ? year : year - 1;
	return `${start}-${start + 1}`;
}

function slug(name) {
	return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function yaml(value) {
	return JSON.stringify(value);
}

function field(source, name) {
	return new RegExp(`^${name}:\\s*(.+)$`, "m").exec(source)?.[1]?.trim();
}

function unquote(value) {
	if (!value) return "";
	try { return JSON.parse(value); } catch { return value.replace(/^['"]|['"]$/g, ""); }
}

export function reportText(row) {
	return `---\ntitle: ${yaml(`${row.home} – ${row.away}`)}\ndate: ${row.date}\nhome: ${yaml(row.home)}\naway: ${yaml(row.away)}\ncompetition: ${yaml(row.competition)}\nscore:\n  home: ${row.score.home}\n  away: ${row.score.away}\n---\n\n`;
}

export async function createMissingReports(rows, { directory = root, today = amsterdamDay(new Date()) } = {}) {
	const currentSeason = seasonFor(today);
	const seasonDir = path.join(directory, currentSeason);
	let files;
	try { files = (await readdir(seasonDir)).filter(file => file.endsWith(".md")); }
	catch (error) { if (error.code !== "ENOENT") throw error; files = []; }
	const existing = [];
	for (const file of files) {
		const source = await readFile(path.join(seasonDir, file), "utf8");
		existing.push({ file, date: unquote(field(source, "date")), home: teamKey(unquote(field(source, "home"))), away: teamKey(unquote(field(source, "away"))) });
	}
	const created = [];
	const skipped = [];
	for (const row of rows.filter(row => seasonFor(row.date) === currentSeason && row.date <= today).sort((a, b) => a.date.localeCompare(b.date))) {
		const sameDay = existing.filter(item => item.date === row.date);
		if (sameDay.some(item => item.home === teamKey(row.home) && item.away === teamKey(row.away))) continue;
		if (sameDay.length) { skipped.push(`${row.date}: bestaand verslag op dezelfde datum; controleer de ploegen.`); continue; }
		const opponent = teamKey(row.home) === "cambuur" ? row.away : row.home;
		const file = `${row.date}-${slug(opponent)}.md`;
		await mkdir(seasonDir, { recursive: true });
		try {
			await writeFile(path.join(seasonDir, `${currentSeason}.11tydata.js`),
				`export default {\n\tseason: "${currentSeason}",\n\tcompetition: "Eredivisie",\n};\n`, { flag: "wx" });
		} catch (error) { if (error.code !== "EEXIST") throw error; }
		try {
			await writeFile(path.join(seasonDir, file), reportText(row), { flag: "wx" });
			created.push(path.join(seasonDir, file));
			existing.push({ file, date: row.date, home: teamKey(row.home), away: teamKey(row.away) });
		} catch (error) {
			if (error.code !== "EEXIST") throw error;
			skipped.push(`${file}: bestand bestaat al.`);
		}
	}
	return { created, skipped };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		const { created, skipped } = await createMissingReports(await fetchResults());
		for (const file of created) console.log(`Nieuw verslag klaarzetten: ${path.relative(process.cwd(), file)}`);
		for (const reason of skipped) console.warn(`Overgeslagen: ${reason}`);
		console.log(created.length ? `${created.length} verslag${created.length === 1 ? "" : "en"} klaar om te schrijven.` : "Geen nieuwe gespeelde wedstrijden zonder verslag.");
	} catch (error) {
		console.warn(`Controle op nieuwe verslagen overgeslagen: ${error.message}`);
	}
}
