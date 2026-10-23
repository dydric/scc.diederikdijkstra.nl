import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseResults } from "../../src/lib/scc-results.js";
import { createMissingReports } from "../scripts/scc-new-reports.mjs";

const html = `<article><div class='block-title'><h1>Uitslagen</h1></div>
<div class='content-title'><span class='bold'>VriendenLoterij Eredivisie</span></div><div class="data results clearfix">
<div class="row"><div class="item-1">18/10/2026</div><div class="item-2">SC Cambuur</div><div class="item-3">AZ</div><div class="item-4">2-2</div></div>
<div class="row"><div class="item-1">24/10/2026</div><div class="item-2">Willem II</div><div class="item-3">SC Cambuur</div><div class="item-4">1-2</div></div></div>
<div class='content-title'><span class='bold'>Voorbereiding</span></div><div class="data results clearfix"><div class="row"><div class="item-1">10/07/2026</div><div class="item-2">SC Cambuur</div><div class="item-3">Roda JC</div><div class="item-4">2-1</div></div></div></article>`;

test("leest officiële eindstanden en negeert oefenwedstrijden", () => {
	const rows = parseResults(html);
	assert.equal(rows.length, 2);
	assert.deepEqual(rows[0].score, { home: 2, away: 2 });
	assert.equal(rows[1].date, "2026-10-24");
	assert.throws(() => parseResults(html.replace("1-2", "-")), /Ongeldige wedstrijd/);
});

test("maakt alleen ontbrekende verslagen aan en overschrijft geen bestaand werk", async () => {
	const directory = await mkdtemp(path.join(tmpdir(), "scc-reports-"));
	try {
		const seasonDir = path.join(directory, "2026-2027");
		await mkdir(seasonDir);
		const existing = path.join(seasonDir, "2026-10-18-az.md");
		await writeFile(existing, '---\ndate: 2026-10-18\nhome: "SC Cambuur"\naway: "AZ Alkmaar"\n---\n\nMijn verslag.\n');
		const rows = parseResults(html);
		const first = await createMissingReports(rows, { directory, today: "2026-10-25" });
		assert.equal(first.created.length, 1);
		assert.equal(path.basename(first.created[0]), "2026-10-24-willem-ii.md");
		assert.match(await readFile(first.created[0], "utf8"), /score:\n  home: 1\n  away: 2/);
		assert.match(await readFile(existing, "utf8"), /Mijn verslag/);
		assert.deepEqual((await createMissingReports(rows, { directory, today: "2026-10-25" })).created, []);
		assert.equal((await readdir(seasonDir)).filter(file => file.endsWith(".md")).length, 2);
	} finally { await rm(directory, { recursive: true, force: true }); }
});
