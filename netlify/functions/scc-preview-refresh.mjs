import { getStore } from "@netlify/blobs";
import scheduleSeed from "../../src/scc/upcoming.json" with { type: "json" };
import previewSeed from "../../src/scc/preview.json" with { type: "json" };
import teams from "../../src/scc/preview-teams.json" with { type: "json" };
import { latestSnapshot } from "../../src/lib/scc-upcoming.js";
import { refreshPreview } from "../../src/lib/scc-preview.js";
import { footballClient } from "../../src/lib/scc-football-api.js";

export default async (_request, context) => {
	const deadline = Date.now() + 25000;
	// Deploy Previews en lokale functies mogen de productiequota niet gebruiken.
	if (context?.deploy?.context !== "production" || context.deploy.published !== true || !process.env.API_FOOTBALL_KEY) return;
	const store = getStore({ name: "scc-preview", consistency: "strong" });
	const now = new Date();
	const current = latestSnapshot(await store.get("preview", { type: "json" }), previewSeed);
	if (current.checkedAt?.slice(0, 10) === now.toISOString().slice(0, 10)) return;
	const schedule = latestSnapshot(await getStore({ name: "scc-upcoming", consistency: "strong" })
		.get("schedule", { type: "json" }), scheduleSeed);
	// Een conditionele dagclaim voorkomt dubbel verbruik bij gelijktijdige runs
	// en retries. Bij een afgebroken run wachten we bewust tot de volgende dag.
	const claim = await store.setJSON(`runs/${now.toISOString().slice(0, 10)}`, { startedAt: now.toISOString() }, { onlyIfNew: true });
	if (!claim.modified) return;
	const api = footballClient({ key: process.env.API_FOOTBALL_KEY, maximum: 3, deadline });
	const next = await refreshPreview({ snapshot: current, fixtures: schedule.fixtures, teams, api, now });
	await store.setJSON("preview", next);
	console.log(`Voorbeschouwing bijgewerkt; ${api.calls} API-verzoeken, resterend: ${api.remaining ?? "onbekend"}.`);
};

// Na de bestaande programmacontrole van 03:00 UTC. Geen API-aanroep per bezoek.
export const config = { schedule: "15 3 * * *" };
