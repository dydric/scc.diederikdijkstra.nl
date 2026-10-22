// CSS en JS per pagina: alleen wat een pagina gebruikt, wordt geladen. Zie
// docs/architectuur/assets.md.
//
// Een asset is een naam, met een CSS- en/of JS-bestand van die naam:
//
//   src/css/components/<naam>.css   src/js/components/<naam>.js
//   src/css/pages/<naam>.css        src/js/pages/<naam>.js
//
// Een template, layout of partial meldt hem aan met {% asset "<naam>" %}. Dat
// gaat in de bundle "assets" van Eleventy (addBundle); {% getBundle "assets" %}
// in de <head> van base.njk wordt na het renderen vervangen door de tags. Zo
// komt een component diep in de body toch in de <head>, en elke naam maar één
// keer.
//
// De CSS compileert Eleventy zelf, met @tailwindcss/node: een bestand begint
// met @reference naar tw.css en gebruikt dan @apply, zonder de utilities nog
// eens mee te nemen. Klein (tot INLINE_LIMIT) komt hij inline in de <head>,
// anders als <link>. De JS bouwt esbuild (package.json: *:js), als ES-modules
// met splitting: wat meerdere bundels delen, staat in js/chunks/.
//
// Elke URL krijgt ?v=: in productie de hash van de inhoud (de bestanden zijn
// dan een jaar te cachen, _headers, hieronder), in dev het tijdstip van de
// build (en geen cache-header).

import { compile, optimize } from "@tailwindcss/node";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SRC = "src";
const KINDS = ["components", "pages"];

// Tot zoveel bytes (geminificeerd) komt component-CSS inline in de <head>:
// een request minder, en zo klein dat cachen weinig scheelt.
const INLINE_LIMIT = 1500;

const hash = (content) => createHash("sha256").update(content).digest("hex").slice(0, 10);

const exists = (file) => fs.existsSync(path.join(SRC, file));

// De bestanden bij een naam: { css: "css/components/scc-ui.css", js: … },
// relatief aan src/ en aan de uitvoer. Een naam hoort bij components óf pages.
const resolve = (name) => {
	const found = {};
	for (const ext of ["css", "js"]) {
		const files = KINDS.map((kind) => `${ext}/${kind}/${name}.${ext}`).filter(exists);
		if (files.length > 1) {
			throw new Error(`[assets] "${name}" staat in components én pages: ${files.join(", ")}`);
		}
		if (files.length) found[ext] = files[0];
	}
	return found;
};

export default function assetsPlugin(eleventyConfig, { isProd }) {
	const outputDir = () => eleventyConfig.directories.output;
	// De gecompileerde CSS per bestand, opnieuw bij elke build.
	let compiled = new Map();
	let buildTime = String(Date.now());

	// ?v= voor een gebouwd bestand in de uitvoer (bijvoorbeeld "css/tw.css").
	// In productie moet het er al staan: package.json bouwt CSS en JS vóór
	// Eleventy.
	const version = (file) => {
		if (!isProd) return buildTime;
		const built = path.join(outputDir(), file);
		if (!fs.existsSync(built)) {
			console.warn(`[assets] ${built} bestaat (nog) niet; ?v= wordt het tijdstip van de build.`);
			return buildTime;
		}
		return hash(fs.readFileSync(built));
	};

	const compileCss = async (file) => {
		const source = path.join(SRC, file);
		const input = fs.readFileSync(source, "utf8");
		const compiler = await compile(input, {
			base: path.resolve(path.dirname(source)),
			onDependency() {},
		});
		// Zonder de licentieregel van Tailwind: die staat al in tw.css.
		return optimize(compiler.build([]), { minify: true }).code.replace(/^\/\*![^]*?\*\/\s*/, "");
	};

	// Alle component- en pagina-CSS compileren en wegschrijven, vóór de
	// templates: dan is hij er als de bundle de tags maakt.
	eleventyConfig.on("eleventy.before", async () => {
		buildTime = String(Date.now());
		compiled = new Map();
		for (const kind of KINDS) {
			const dir = path.join(SRC, "css", kind);
			if (!fs.existsSync(dir)) continue;
			for (const entry of fs.readdirSync(dir)) {
				if (!entry.endsWith(".css")) continue;
				const file = `css/${kind}/${entry}`;
				const css = await compileCss(file);
				compiled.set(file, css);
				const out = path.join(outputDir(), file);
				fs.mkdirSync(path.dirname(out), { recursive: true });
				fs.writeFileSync(out, css);
			}
		}
	});

	// Van de namen op een pagina naar de tags in de <head>: eerst alle CSS,
	// dan de scripts.
	const toTags = (names) => {
		const styles = [];
		const scripts = [];
		for (const name of names.split("\n").filter(Boolean)) {
			const { css, js } = resolve(name);
			if (css) {
				const code = compiled.get(css) ?? "";
				styles.push(code.length <= INLINE_LIMIT
					? `<style data-asset="${name}">${code}</style>`
					: `<link rel="stylesheet" href="/${css}?v=${isProd ? hash(code) : buildTime}">`);
			}
			if (js) scripts.push(`<script type="module" src="/${js}?v=${version(js)}"></script>`);
		}
		return [...styles, ...scripts].join("\n");
	};

	eleventyConfig.addBundle("assets", {
		shortcodeName: false,
		transforms: [toTags],
	});

	// {% asset "<naam>" %}: de asset aanmelden voor deze pagina.
	eleventyConfig.addShortcode("asset", function (name) {
		const url = this.page?.url;
		if (!url) {
			throw new Error(`[assets] {% asset "${name}" %} zonder pagina. In een macro: importeer hem "with context".`);
		}
		const found = resolve(name);
		if (!found.css && !found.js) {
			throw new Error(`[assets] Geen CSS of JS voor "${name}" in ${KINDS.map((kind) => `{css,js}/${kind}/`).join(" of ")}.`);
		}
		eleventyConfig.getBundleManagers().assets.addToPage(url, name);
		return "";
	});

	// {% assetUrl "css/tw.css" %}: de URL met ?v=, voor wat altijd geladen
	// wordt (tw.css, core.js).
	eleventyConfig.addShortcode("assetUrl", (file) => `/${file}?v=${version(file)}`);

	// CSS en JS een jaar cachen (immutable), alleen in productie: daar is
	// ?v= de hash van de inhoud. Als _headers in de uitvoer, niet in
	// netlify.toml: die headers gelden ook in netlify dev, en daar is ?v=
	// het tijdstip van de laatste Eleventy-build. Verandert alleen de JS
	// (esbuild), dan blijft die gelijk, en hield de browser de oude versie
	// vast. Zonder deze header vraagt hij in dev bij elke herlaadbeurt na
	// of het bestand nog klopt.
	if (isProd) {
		eleventyConfig.on("eleventy.after", () => {
			const rule = (dir) => `/${dir}/*\n  Cache-Control: public, max-age=31536000, immutable\n`;
			fs.writeFileSync(path.join(outputDir(), "_headers"), [rule("css"), rule("js")].join("\n"));
		});
	}
}
