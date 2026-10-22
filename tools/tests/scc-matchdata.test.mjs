import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
	linkedSource,
	responseFixture,
	validate,
} from "../scripts/scc-matchdata.mjs";
import { loadMatchData } from "../../src/lib/scc-matchdata.js";

const payload = JSON.parse(readFileSync(
	"src/scc/api/1552195.json",
	"utf8",
));
const match = responseFixture(payload);
const file = "src/scc/2026-2027/2026-10-18-az.md";
const source = `---
title: "SC Cambuur – AZ Alkmaar"
date: 2026-10-18
home: "SC Cambuur"
away: "AZ Alkmaar"
score:
  home: 2
  away: 2
---

Mijn eigen verslag blijft staan.
`;

test("controleert datum, Cambuurs thuispositie en eindstand voor koppeling", () => {
	assert.equal(validate(match, source, 1552195, file).date, "2026-10-18");
	assert.equal(validate(match, source, 1552195,
		"src/scc/2026-2027/wedstrijd-tegen-az.md").date, "2026-10-18");
	assert.throws(() => validate(
		match,
		source.replace("away: 2", "away: 3"),
		1552195,
		file,
	), /uitslag/);
	assert.throws(() => validate(
		match,
		source.replace("date: 2026-10-18", "date: 2026-10-19"),
		1552195,
		file,
	), /datum/);
	assert.throws(() => validate(
		match,
		source.replace('home: "SC Cambuur"', 'home: "AZ Alkmaar"'),
		1552195,
		file,
	), /Thuis- en uitploeg/);
	assert.throws(() => validate(
		match,
		source.replace('away: "AZ Alkmaar"', 'away: "Feyenoord"'),
		1552195,
		file,
	), /tegenstander/);
});

test("herkent expliciete API-clubnamen zonder de scorecontrole te verzwakken", () => {
	for (const [id, name] of [[1381924, "2025-08-15-top-oss.md"], [1381983, "2025-09-22-jong-fc-utrecht.md"]]) {
		const file = `src/scc/2025-2026/${name}`;
		const source = readFileSync(file, "utf8").replace(/^matchdata:.*\n/m, "");
		const match = responseFixture(JSON.parse(readFileSync(`src/scc/api/${id}.json`, "utf8")));
		assert.ok(match);
		assert.doesNotThrow(() => validate(match, source, id, file));
		assert.throws(() => validate(match, source.replace(/^  away: (\d+)$/m, (_, goal) => `  away: ${Number(goal) + 1}`), id, file), /uitslag/);
	}
});

test("koppelt alleen het ID en bewaart het eigen verslag", () => {
	const result = linkedSource(source, 1552195);
	assert.match(result, /^matchdata: 1552195$/m);
	assert.doesNotMatch(result, /^match:|^fixtureId:/m);
	assert.ok(result.endsWith("\nMijn eigen verslag blijft staan.\n"));
	assert.throws(() => validate(match, result, 1552195, file), /al geïmporteerde/);
});

test("bestaande pending-status wordt vervangen", () => {
	const prepared = source.replace(
		'title: "SC Cambuur – AZ Alkmaar"',
		'title: "SC Cambuur – AZ Alkmaar"\nmatchdata: pending',
	);
	const result = linkedSource(prepared, 1552195);
	assert.equal((result.match(/^matchdata:/gm) ?? []).length, 1);
	assert.match(result, /^matchdata: 1552195$/m);
});

test("laadt de volledige opgeslagen respons via het ID", () => {
	const data = {
		season: "2026-2027",
		matchdata: 1552195,
		date: new Date("2026-10-18"),
		home: "SC Cambuur",
		away: "AZ Alkmaar",
		score: { home: 2, away: 2 },
	};
	assert.deepEqual(loadMatchData(data), match);
	assert.equal(loadMatchData({ ...data, matchdata: null }), null);
	assert.throws(() => loadMatchData({ ...data, date: "2026-10-19" }), /front matter/);
	assert.throws(() => loadMatchData({ ...data, away: "Feyenoord" }), /front matter/);
	assert.throws(() => loadMatchData({ ...data, season: "2025-2026" }), /verwachte wedstrijd/);
	assert.throws(() => loadMatchData({ ...data, matchdata: 9999999 }), /niet lezen/);
});
