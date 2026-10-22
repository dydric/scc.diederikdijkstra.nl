import test from "node:test";
import assert from "node:assert/strict";
import { footballClient } from "../../src/lib/scc-football-api.js";
import { refreshPreview, previewRows, previewKey, matchFixture, readPrediction, readStandings } from "../../src/lib/scc-preview.js";

const now = new Date("2026-10-21T12:00:00Z");
const first = { date: "2026-10-24T18:45:00+02:00", home: "Willem II", away: "SC Cambuur", competition: "Eredivisie" };
const fixture = { fixture: { id: 1552200, date: first.date, status: { short: "NS" } },
	league: { id: 88, season: 2026 }, teams: { home: { id: 195, name: "Willem II" }, away: { id: 420, name: "Cambuur" } } };
const prediction = { teams: { home: { id: 195, league: { form: "LLDLLLL" } }, away: { id: 420, league: { form: "LLLLDWDWD" } } },
	predictions: { percent: { home: "0%", draw: "50%", away: "50%" } } };
const teams = [{ id: 195, name: "Willem II" }];

test("Free-weigering blokkeert de werkende voorspelling niet en krijgt zeven dagen rust", async () => {
	const calls = [];
	const api = { async get(endpoint) {
		calls.push(endpoint);
		if (endpoint === "standings") throw Object.assign(new Error("plan"), { blocked: true });
		return endpoint === "fixtures/headtohead" ? [fixture] : [prediction];
	} };
	const snapshot = await refreshPreview({ fixtures: [first], teams, api, now });
	assert.deepEqual(calls, ["standings", "fixtures/headtohead", "predictions"]);
	assert.equal(snapshot.resources["standings-2026"].retryAt, "2026-10-28T12:00:00.000Z");
	const view = previewRows([first], snapshot, now)[0].preview;
	assert.equal(view.home.rank, null);
	assert.equal(view.home.form, "DLLLL");
	assert.equal(view.away.form, "DWDWD");
	assert.equal(view.prediction.away, 50);
	calls.length = 0;
	await refreshPreview({ snapshot, fixtures: [first], teams, api, now });
	assert.equal(calls.length, 0);
	await refreshPreview({ snapshot, fixtures: [first], teams, api, now: new Date("2026-10-22T03:15:00Z") });
	assert.deepEqual(calls, ["predictions"]);
});

test("netwerkfouten bewaren goede gegevens en het oorspronkelijke ophaalmoment", async () => {
	const key = `prediction-${previewKey(first)}`;
	const data = readPrediction([prediction], { homeId: 195, awayId: 420 });
	const snapshot = { fixture: { id: 1552200, homeId: 195, awayId: 420, key: previewKey(first) }, resources: {
		[key]: { data, fetchedAt: "2026-10-20T03:15:00Z" },
	} };
	const updated = await refreshPreview({ snapshot, fixtures: [first], teams, now, api: { get() { throw new Error("offline"); } } });
	assert.deepEqual(updated.resources[key].data, data);
	assert.equal(updated.resources[key].fetchedAt, "2026-10-20T03:15:00Z");
	assert.equal(snapshot.checkedAt, undefined);
	assert.equal(previewRows([first], updated, new Date(first.date))[0].preview.prediction, null);
	assert.equal(previewRows([{ ...first, date: "2026-10-25T18:45:00+01:00" }], updated, now)[0].preview.prediction, null);
});

test("controleert datum, seizoen, ploegen en percentages vóór publicatie", () => {
	assert.equal(matchFixture([fixture], first).id, 1552200);
	assert.throws(() => matchFixture([fixture, fixture], first));
	assert.throws(() => matchFixture([fixture], { ...first, date: "2026-10-24T19:45:00+02:00" }));
	assert.throws(() => matchFixture([{ ...fixture, league: { id: 88, season: 2025 } }], first));
	assert.throws(() => readPrediction([prediction], { homeId: 420, awayId: 195 }));
	assert.throws(() => readPrediction([{ ...prediction, predictions: { percent: { home: "70%", draw: "50%", away: "50%" } } }], { homeId: 195, awayId: 420 }));
});

test("ranglijst levert positie, punten en vorm aan alle tegenstanders, nooit aan een andere competitie", () => {
	const table = [{ team: { id: 420, name: "Cambuur" }, rank: 14, points: 9, all: { played: 9 }, form: "DWDWD" },
		{ team: { id: 195, name: "Willem II" }, rank: 18, points: 2, all: { played: 9 }, form: "DLLLL" }];
	const rows = [{ league: { id: 88, season: 2026, standings: [table] } }];
	const data = readStandings(rows, 2026);
	assert.throws(() => readStandings(rows, 2025));
	const snapshot = { resources: { "standings-2026": { data, fetchedAt: now.toISOString() } } };
	const view = previewRows([first], snapshot, now)[0].preview;
	assert.equal(view.away.rank, 14);
	assert.equal(view.home.points, 2);
	assert.equal(previewRows([{ ...first, competition: "KNVB Beker" }], snapshot, now)[0].preview.away.rank, null);
});

test("PSV wordt niet aan Jong PSV gekoppeld", async () => {
	const calls = [];
	await refreshPreview({ fixtures: [{ ...first, home: "PSV" }], teams: [{ id: 411, name: "Jong PSV U21" }], now,
		api: { async get(endpoint) { calls.push(endpoint); return []; } } });
	assert.deepEqual(calls, ["standings", "teams"]);
});

test("client begrenst verzoeken, bewaart quotareserve en stopt bij een ongeldige respons", async () => {
	let calls = 0;
	const fetcher = async () => { calls++; return new Response(JSON.stringify({ response: [] }), { headers: { "x-ratelimit-requests-remaining": "10" } }); };
	const api = footballClient({ key: "test-key", fetcher, pause: async () => {} });
	await api.get("standings", {});
	await assert.rejects(api.get("predictions", {}), /budget/);
	assert.equal(calls, 1);
	const capped = footballClient({ key: "test-key", maximum: 1, fetcher: async () => new Response('{"response":[]}') });
	await capped.get("standings", {});
	await assert.rejects(capped.get("predictions", {}), /budget/);
	const blocked = footballClient({ key: "test-key", fetcher: async () => new Response('{"errors":{"plan":"Free plan"},"response":[]}') });
	await assert.rejects(blocked.get("standings", {}), error => error.blocked === true);
	const timedOut = footballClient({ key: "test-key", deadline: Date.now() + 1000, fetcher });
	await assert.rejects(timedOut.get("standings", {}), /Tijdbudget/);
	assert.equal(calls, 1);
});

test("Netlify-preview en ongepubliceerde deploy doen geen API- of Blob-aanroepen", async () => {
	const { default: refresh } = await import("../../netlify/functions/scc-preview-refresh.mjs");
	await refresh(null, { deploy: { context: "deploy-preview", published: false } });
	await refresh(null, { deploy: { context: "production", published: false } });
	await refresh(null, undefined);
});
