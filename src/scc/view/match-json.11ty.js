import { matchJson } from "../../lib/scc-view.js";

// Elke wedstrijd krijgt een JSON-uitvoer, ook als er nog geen API-respons is.
export default class {
	data() {
		return {
			pagination: {
				data: "collections.scc",
				size: 1,
				alias: "wedstrijd",
			},
			permalink: ({ wedstrijd }) => `${wedstrijd.data.matchUrl}data.json`,
			eleventyExcludeFromCollections: true,
		};
	}

	render({ wedstrijd }) {
		return matchJson(wedstrijd);
	}
}
