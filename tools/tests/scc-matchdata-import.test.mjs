import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { planMatches } from "../scripts/scc-matchdata-import.mjs";

const payload = JSON.parse(readFileSync("src/scc/api/1552195.json", "utf8"));
const fixture = payload.response[0];
const source = readFileSync("src/scc/2026-2027/2026-10-18-az.md", "utf8")
	.replace("matchdata: 1552195\n", "");

test("importplan koppelt op Markdown-velden en niet op de bestandsnaam", () => {
	const plan = planMatches("2026-2027", [["andere-naam.md", source]], [fixture]);
	assert.equal(plan.issues.length, 0);
	assert.equal(plan.rows[0].match.fixture.id, 1552195);
	assert.equal(plan.rows[0].name, "andere-naam.md");
});

test("importplan weigert een dubbele of afwijkende koppeling", () => {
	const duplicate = planMatches("2026-2027", [
		["een.md", source],
		["twee.md", source],
	], [fixture]);
	assert.match(duplicate.issues.join(" "), /al aan een andere wedstrijd gekoppeld/);
	const wrongScore = planMatches("2026-2027", [
		["az.md", source.replace("away: 2", "away: 3")],
	], [fixture]);
	assert.equal(wrongScore.rows.length, 0);
	assert.equal(wrongScore.issues.length, 1);
});

test("importplan slaat een wedstrijd met matchdata altijd over", () => {
	const linked = readFileSync("src/scc/2026-2027/2026-10-18-az.md", "utf8");
	const missing = readFileSync("src/scc/2026-2027/2026-10-11-pec-zwolle.md", "utf8")
		.replace("matchdata: 1552187\n", "");
	const zwolle = JSON.parse(readFileSync("src/scc/api/1552187.json", "utf8")).response[0];
	const plan = planMatches("2026-2027", [
		["al-gekoppeld.md", linked],
		["zonder-matchdata.md", missing],
	], [fixture, zwolle]);
	assert.equal(plan.linked, 1);
	assert.equal(plan.rows.length, 1);
	assert.equal(plan.rows[0].name, "zonder-matchdata.md");
	assert.equal(plan.rows[0].match.fixture.id, 1552187);
	assert.deepEqual(plan.issues, []);
});
