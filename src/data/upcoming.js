import { readFileSync } from "node:fs";
import { upcomingRows } from "../lib/scc-upcoming.js";
import { previewRows } from "../lib/scc-preview.js";

export default () => previewRows(
	upcomingRows(JSON.parse(readFileSync(new URL("../scc/upcoming.json", import.meta.url)))),
	JSON.parse(readFileSync(new URL("../scc/preview.json", import.meta.url))),
);
