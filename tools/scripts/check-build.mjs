// Volledige controlebuild buiten _site, zonder watcher of server.
// Gebruik --development voor de niet-geminificeerde site.
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';

const directory = await mkdtemp(path.join(tmpdir(), 'scc-site-check-'));
const development = process.argv.includes('--development');
const env = {
	...process.env,
	NODE_ENV: development ? 'development' : 'production',
	SITE_OUTPUT_DIR: directory,
};

const run = (entry, args) => new Promise((resolve, reject) => {
	const child = spawn(process.execPath, [entry, ...args], { env, stdio: 'inherit' });
	child.on('error', reject);
	child.on('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${entry}: ${signal || code}`)));
});

try {
	console.log(`Controlebuild (${env.NODE_ENV}): ${directory}`);
	const entries = ['src/js/core.js'];
	for (const kind of ['pages', 'components']) {
		const folder = `src/js/${kind}`;
		for (const file of await readdir(folder).catch(() => [])) {
			if (file.endsWith('.js')) entries.push(`${folder}/${file}`);
		}
	}
	await Promise.all([
		build({
			entryPoints: entries,
			outbase: 'src/js',
			outdir: path.join(directory, 'js'),
			bundle: true,
			splitting: true,
			format: 'esm',
			chunkNames: 'chunks/[name]-[hash]',
			minify: !development,
		}),
		run('node_modules/@tailwindcss/cli/dist/index.mjs', [
			'-i', 'src/css/tw/tw.css', '-o', path.join(directory, 'css/tw.css'), '--minify',
		]),
	]);
	await run('node_modules/@11ty/eleventy/cmd.cjs', [`--output=${directory}`]);
	console.log(`Controle geslaagd. Uitvoer bewaard in ${directory}`);
} catch (error) {
	console.error(`Controle mislukt; uitvoer voor onderzoek: ${directory}`);
	console.error(error.message);
	process.exitCode = 1;
}
