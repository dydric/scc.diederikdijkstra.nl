import htmlmin from "html-minifier-terser";
import { EleventyRenderPlugin } from "@11ty/eleventy";
import assetsPlugin from './src/lib/assets.js';
import { outputDirectory, setOutputDirectory } from './src/lib/build-paths.js';
import { matchGroups } from './src/lib/scc-view.js';
import { matchView } from './src/lib/scc-match-view.js';
import { matchNeighbors, RATING_BANDS } from './src/lib/scc-match-story.js';
import { archive, row as matchRow } from './src/lib/scc-archive.js';


export default function(eleventyConfig) {

	const isProd = process.env.NODE_ENV === "production";
	eleventyConfig.on('eleventy.directories', ({ output }) => setOutputDirectory(output));

	// Het design system is lokaal; de openbare productiebuild slaat het over.
	if (isProd) eleventyConfig.ignores.add("src/system/**");

	// Markdown gebruikt dezelfde renderer als Nunjucks-pagina's.
	eleventyConfig.addPlugin(EleventyRenderPlugin);
	eleventyConfig.addFilter("sccMatchGroups", matchGroups);
	eleventyConfig.addFilter("sccMatchView", matchView);
	eleventyConfig.addFilter("sccArchive", archive);
	eleventyConfig.addFilter("sccNeighbors", matchNeighbors);
	eleventyConfig.addFilter("sccMatchRow", matchRow);
	eleventyConfig.addGlobalData("sccRatingBands", RATING_BANDS);

	// Ssst!
	eleventyConfig.setQuietMode(true);

	// Watch. De component-CSS bouwt Eleventy zelf (src/lib/assets.js), dus
	// src/css/ geeft een build. De JS niet: die bouwt esbuild (w:js), en een
	// build op src/js/ herlaadt vóór esbuild klaar is, met de oude JS.
	eleventyConfig.addWatchTarget('./src/css/');
	// Wedstrijd-JSON wordt met readFileSync geladen en heeft daardoor geen
	// automatische template-afhankelijkheid. SCC-helpers laden als modules;
	// bij een wijziging moet Eleventy ook de configuratie opnieuw inlezen.
	eleventyConfig.addWatchTarget('./src/scc/api/');
	eleventyConfig.addWatchTarget('./src/lib/scc-*.js', { resetConfig: true });

	// De dev-server (npm run dev, achter netlify dev). Herladen gaat altijd
	// helemaal: met domDiff zet hij een gewijzigde pagina via morphdom in de
	// DOM zonder de scripts opnieuw te draaien, en zet hij de attributen van
	// <html> terug op die uit de HTML. Weg zijn dan wat de JS zette: .js,
	// --dpr, data-dock-* (de console blijft halverwege staan), de cellen
	// van de ticker. Zo begint de JS elke keer
	// schoon, en gaat de dock door met de rij van vóór het herladen
	// (RELOAD("/pad/"), partials/dock.njk).
	//
	// watch: wat niet via Eleventy komt. tw.css (Tailwind CLI) wisselt
	// zonder herladen; de JS (esbuild, ook js/chunks/) herlaadt pas als
	// esbuild hem heeft geschreven. no-cache: de browser vraagt elk bestand
	// opnieuw na, ook als ?v= (het tijdstip van de laatste Eleventy-build)
	// gelijk bleef.
	eleventyConfig.setServerOptions({
		domDiff: false,
		watch: ['_site/css/tw.css', '_site/js/**/*.js'],
		headers: { 'Cache-Control': 'no-cache' },
	});

	// Pass-through
	eleventyConfig.addPassthroughCopy({
		"src/assets/": "/assets/",
	});

	// CSS en JS per pagina: {% asset "<naam>" %}, {% getBundle "assets" %},
	// {% assetUrl "<bestand>" %}. Zie src/lib/assets.js en docs/architectuur/assets.md.
	eleventyConfig.addPlugin(assetsPlugin, { isProd });

	// Minify HTML
	if (isProd) {
		eleventyConfig.addTransform("htmlmin", function (content) {
			if ((this.page.outputPath || "").endsWith(".html")) {
				let minified = htmlmin.minify(content, {
					useShortDoctype: true,
					removeComments: true,
					collapseWhitespace: true,
					// Inline <script> door terser: commentaar eruit, op één regel,
					// lokale namen ingekort. Alle inline-scripts zijn IIFE's, dus er
					// is niets te mangelen waar andere code op leunt.
					minifyJS: true,
				});
				return minified;
			}
			return content;
		});
	}

	// Output
	return {
		dir: {
			input: "src",
			output: outputDirectory(),
			layouts: "/includes/layouts",
			includes: "/includes/partials",
			data: "/data"
		}
	};
};
