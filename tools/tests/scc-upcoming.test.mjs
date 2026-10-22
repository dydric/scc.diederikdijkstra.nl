import assert from "node:assert/strict";
import test from "node:test";
import { fetchUpcoming, latestSnapshot, parseUpcoming, refreshDue, upcomingRows, programUrl } from "../../src/lib/scc-upcoming.js";

const html = `<article><div class='block-title'><h1>Programma</h1></div>
<div class='content-title'><span class='bold'>Vriendenloterij Eredivisie</span></div>
<div class="data programma clearfix"><div class="head"></div>
<div class="row"><div class="item-1">24/10/2026</div><div class="item-2">18.45 uur</div><div class="item-3">Willem II</div><div class="item-4">SC Cambuur</div></div></div>
<div class='content-title'><span class='bold'>Eurojackpot KNVB Beker</span></div>
<div class="data programma clearfix"><div class="row"><div class="item-1">27/10/2026</div><div class="item-2">20.00 uur</div><div class="item-3">VV Kloetinge</div><div class="item-4">SC Cambuur</div></div></div>
<div class='content-title'><span class='bold'>Vriendenloterij Eredivisie</span></div>
<div class="data programma clearfix"><div class="row"><div class="item-1">31/10/2026</div><div class="item-2">21.00 uur</div><div class="item-3">SC Cambuur</div><div class="item-4">Go Ahead Eagles</div></div></div></article>`;
const now = new Date("2026-10-20T12:00:00Z");

test("leest de clubsite inclusief beker en de Amsterdamse wintertijd", () => {
	const snapshot = parseUpcoming(html, now);
	assert.deepEqual(snapshot.fixtures.map(row => row.date), [
		"2026-10-24T18:45:00+02:00", "2026-10-27T20:00:00+01:00",
		"2026-10-31T21:00:00+01:00",
	]);
	assert.equal(snapshot.fixtures[0].round, 10);
	assert.equal(snapshot.fixtures[1].competition, "KNVB Beker");
	const rows = upcomingRows(snapshot, now);
	assert.equal(rows[0].context, "Eredivisie · Ronde 10");
	assert.equal(rows[2].home, "SC Cambuur");
});

test("ververst pas na de eerste speeldag en toont dan de volgende wedstrijd", () => {
	const snapshot = parseUpcoming(html, now);
	assert.equal(refreshDue(snapshot, new Date("2026-10-24T21:30:00Z")), false);
	assert.equal(refreshDue(snapshot, new Date("2026-10-24T22:30:00Z")), true);
	assert.equal(upcomingRows(snapshot, new Date("2026-10-25T12:00:00Z"))[0].home, "VV Kloetinge");
	const empty = parseUpcoming(html, new Date("2026-11-01T12:00:00Z"));
	assert.deepEqual(empty.fixtures, []);
	assert.equal(refreshDue(empty, new Date("2026-11-07T12:00:00Z")), false);
	assert.equal(refreshDue(empty, new Date("2026-11-08T12:00:00Z")), true);
});

test("weigert een gewijzigde of ongeldige clubpagina", () => {
	assert.throws(() => parseUpcoming("<article><h1>Nieuws</h1></article>", now), /programma/);
	assert.throws(() => parseUpcoming(html.replace("24/10/2026", "32/10/2026"), now), /datum/);
	assert.throws(() => parseUpcoming(html.replace("Willem II", "Ajax").replace("SC Cambuur</div></div></div>", "PSV</div></div></div>"), now), /Cambuur/);
});

test("haalt het officiële programma met één verzoek op", async () => {
	let calls = 0;
	const result = await fetchUpcoming(async (url, options) => {
		calls += 1;
		assert.equal(url, programUrl);
		assert.equal(options.headers.Accept, "text/html");
		return { ok: true, text: async () => html };
	}, now);
	assert.equal(calls, 1);
	assert.equal(result.fixtures.length, 3);
});

test("nieuwe build vervangt een oudere lege Netlify-momentopname", () => {
	const seed = parseUpcoming(html, now);
	const old = { checkedAt: "2026-10-19T12:00:00Z", fixtures: [] };
	assert.equal(latestSnapshot(old, seed), seed);
	assert.equal(latestSnapshot(null, seed), seed);
	const newer = { checkedAt: "2026-10-25T12:00:00Z", fixtures: [] };
	assert.equal(latestSnapshot(newer, seed), newer);
});
