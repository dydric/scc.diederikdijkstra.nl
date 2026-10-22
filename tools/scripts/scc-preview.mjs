import { footballClient } from "../../src/lib/scc-football-api.js";
import { readFile, writeFile, rename } from "node:fs/promises";
import { refreshPreview } from "../../src/lib/scc-preview.js";

export async function importPreview() {
	const file = new URL("../../src/scc/preview.json", import.meta.url);
	const snapshot = JSON.parse(await readFile(file, "utf8"));
	if (snapshot.checkedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)) {
		console.log("Voorbeschouwing vandaag al gecontroleerd. Geen API-verzoek.");
		return;
	}
	const schedule = JSON.parse(await readFile(new URL("../../src/scc/upcoming.json", import.meta.url), "utf8"));
	const teams = JSON.parse(await readFile(new URL("../../src/scc/preview-teams.json", import.meta.url), "utf8"));
	if (!process.env.API_FOOTBALL_KEY) throw new Error("API_FOOTBALL_KEY ontbreekt.");
	const api = footballClient({ key: process.env.API_FOOTBALL_KEY, maximum: 3 });
	const next = await refreshPreview({ snapshot, fixtures: schedule.fixtures, teams, api });
	const temporary = new URL("../../src/scc/preview.json.tmp", import.meta.url);
	await writeFile(temporary, JSON.stringify(next, null, 2) + "\n");
	await rename(temporary, file);
	console.log(JSON.stringify({ calls: api.calls, remaining: api.remaining,
		resources: Object.fromEntries(Object.entries(next.resources).map(([key, value]) => [key, value.status ?? "ok"])) }));
}
