import { getStore } from "@netlify/blobs";
import seed from "../../src/scc/upcoming.json" with { type: "json" };
import { fetchUpcoming, latestSnapshot, refreshDue } from "../../src/lib/scc-upcoming.js";

export default async () => {
	const store = getStore({ name: "scc-upcoming", consistency: "strong" });
	const current = latestSnapshot(await store.get("schedule", { type: "json" }), seed);
	if (!refreshDue(current)) return;
	const next = await fetchUpcoming();
	await store.setJSON("schedule", next);
	console.log(`Wedstrijdprogramma bijgewerkt: ${next.fixtures.length} wedstrijden.`);
};

// Dagelijkse controle; een verzoek naar de clubsite volgt pas na de eerste speeldag.
export const config = { schedule: "0 3 * * *" };
