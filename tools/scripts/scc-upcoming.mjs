import { readFile, writeFile } from "node:fs/promises";
import { fetchUpcoming, refreshDue } from "../../src/lib/scc-upcoming.js";

const file = new URL("../../src/scc/upcoming.json", import.meta.url);
const current = JSON.parse(await readFile(file, "utf8"));
if (!refreshDue(current)) {
	console.log("De eerstvolgende speeldag is nog niet voorbij. Geen verzoek naar de clubsite.");
} else {
	const next = await fetchUpcoming();
	await writeFile(file, JSON.stringify(next, null, 2) + "\n");
	console.log(`${next.fixtures.length} komende wedstrijden opgeslagen.`);
}
