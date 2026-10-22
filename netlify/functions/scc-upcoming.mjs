import { getStore } from "@netlify/blobs";
import seed from "../../src/scc/upcoming.json" with { type: "json" };
import { latestSnapshot, upcomingRows } from "../../src/lib/scc-upcoming.js";
import previewSeed from "../../src/scc/preview.json" with { type: "json" };
import { previewRows } from "../../src/lib/scc-preview.js";

export default async () => {
	let snapshot = seed;
	try {
		const stored = await getStore({ name: "scc-upcoming", consistency: "strong" })
			.get("schedule", { type: "json" });
		snapshot = latestSnapshot(stored, seed);
	} catch (error) {
		console.error("Kan het wedstrijdprogramma niet lezen:", error);
	}
	let preview = previewSeed;
	try {
		preview = latestSnapshot(await getStore({ name: "scc-preview", consistency: "strong" })
			.get("preview", { type: "json" }), previewSeed);
	} catch {
		console.error("Kan de voorbeschouwing niet lezen; lokale momentopname gebruikt.");
	}
	return Response.json({ rows: previewRows(upcomingRows(snapshot), preview) }, {
		headers: { "Cache-Control": "public, max-age=0, s-maxage=300" },
	});
};
