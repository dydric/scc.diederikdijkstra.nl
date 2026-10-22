import path from "node:path";
import { videoAvailable } from "../lib/scc-video.js";
import { loadMatchData, markdownDate } from "../lib/scc-matchdata.js";

// Wedstrijdverhalen blijven brondata; view maakt de voorlopige pagina's.
export default {
	tags: ["scc"],
	permalink: false,
	matchdata: null,
	eleventyComputed: {
		match: data => data.page.inputPath.endsWith(".md") ? loadMatchData(data) : null,
		matchDate: data => data.page.inputPath.endsWith(".md") ? markdownDate(data.date) : null,
		videoAvailable: data => data.page.inputPath.endsWith(".md") ? videoAvailable(data.videoUrl) : false,
		matchUrl: data => data.page.inputPath.endsWith(".md")
			? `/${path.basename(data.page.inputPath, ".md")}/`
			: null,
	},
};
