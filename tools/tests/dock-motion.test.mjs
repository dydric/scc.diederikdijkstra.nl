import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const template = await readFile(new URL('../../src/includes/partials/dock.njk', import.meta.url), 'utf8');
const scripts = [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

function render({ reduced, fresh = true, booted = true }) {
	const attributes = new Set();
	const cellAttributes = new Set();
	const cell = { textContent: 'LEEUWARDEN', setAttribute: (name) => cellAttributes.add(name) };
	const root = {
		setAttribute: (name) => attributes.add(name),
		removeAttribute: (name) => attributes.delete(name),
		hasAttribute: (name) => attributes.has(name),
	};
	const saved = { at: Date.now() - (fresh ? 1 : 10001), cells: [['X', true]] };
	const context = vm.createContext({
		document: { documentElement: root, querySelectorAll: () => [cell] },
		matchMedia: () => ({ matches: reduced }),
		sessionStorage: { getItem: (key) => key === 'dock-boot' ? (booted ? '1' : null) : JSON.stringify(saved) },
		setTimeout: () => {},
	});
	for (const script of scripts) vm.runInContext(script, context);
	return { cell, attributes, cellAttributes };
}

test('reduced motion bewaart HTML-tekst ondanks een verse vorige rij', () => {
	const { cell, attributes, cellAttributes } = render({ reduced: true });
	assert.equal(cell.textContent, 'LEEUWARDEN');
	assert.equal(attributes.has('data-dock-restored'), false);
	assert.equal(attributes.has('data-dock-pending'), false);
	assert.equal(cellAttributes.size, 0);
});

test('gewone paginawissel herstelt verse tekst en meldingskleur', () => {
	const { cell, attributes, cellAttributes } = render({ reduced: false });
	assert.equal(cell.textContent, 'X');
	assert.equal(attributes.has('data-dock-restored'), true);
	assert.equal(attributes.has('data-dock-pending'), true);
	assert.equal(cellAttributes.has('data-ticker-warn'), true);
});

test('verlopen rij en eerste sessiepagina worden niet hersteld', () => {
	for (const options of [{ fresh: false }, { booted: false }]) {
		const { cell, attributes } = render({ reduced: false, ...options });
		assert.equal(cell.textContent, 'LEEUWARDEN');
		assert.equal(attributes.has('data-dock-restored'), false);
	}
});
