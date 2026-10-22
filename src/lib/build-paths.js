// Eén uitvoermap voor pagina's en afbeeldingen. Eleventy geeft ook een
// eventuele --output door voordat de globale data wordt opgebouwd.
import path from 'node:path';

let directory = process.env.SITE_OUTPUT_DIR || '_site';

export function setOutputDirectory(output) {
	directory = output;
}

export function outputDirectory(...parts) {
	return path.join(directory, ...parts);
}
