// De twee lokale stijlproeven delen de brede werkruimte en blijven buiten productie.
export default {
	layout: "system.njk",
	edges: false,
	// Alleen de stijlproeven tonen nog het meetraster (layouts/base.njk).
	grid: true,
	permalink: (data) => `/system/${data.page.fileSlug}/`,
	hidepageforseo: true,
	eleventyExcludeFromCollections: true,
};
