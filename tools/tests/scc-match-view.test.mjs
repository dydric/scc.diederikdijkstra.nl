import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matchView } from "../../src/lib/scc-match-view.js";

function viewFor(id, extraData = {}) {
	const match = JSON.parse(readFileSync(`src/scc/api/${id}.json`, "utf8")).response[0];
	return matchView({ data: {
		match,
		home: match.teams.home.id === 420 ? "SC Cambuur" : match.teams.home.name,
		away: match.teams.away.id === 420 ? "SC Cambuur" : match.teams.away.name,
		score: match.goals,
		competition: match.league.name,
		title: `${match.teams.home.name} – ${match.teams.away.name}`,
		...extraData,
	} });
}

test("AZ: tijdlijn toont geel en rood zonder oorzaak toe te voegen", () => {
	const view = viewFor(1552195, { videoUrl: "https://www.youtube.com/watch?v=pAI6bLCxwnc" });
	assert.equal(view.video.embedUrl, "https://www.youtube-nocookie.com/embed/pAI6bLCxwnc");
	assert.equal(view.pointsText, "+1 competitiepunt");
	assert.equal(view.round, "Eredivisie - Ronde 9");
	assert.equal(view.timeline.filter(item => item.type === "Goal").at(-1).score, "2–2");
	const cards = view.timeline.filter(item => item.player === "Devid Eugene Bouah");
	assert.deepEqual(cards.map(item => [item.minute, item.label]), [
		["24′", "Gele kaart"], ["53′", "Rode kaart"],
	]);
	assert.equal(view.stats.find(item => item.label.includes("xG")).home, "1,53");
});

test("alleen een geldig YouTube-video-ID wordt ingebed", () => {
	assert.equal(viewFor(1552195, { videoUrl: "https://example.com/watch?v=pAI6bLCxwnc" }).video, null);
	assert.equal(viewFor(1552195, { videoUrl: "https://www.youtube.com/watch?v=ongeldig" }).video, null);
});

test("Dordrecht: twee keer geel en rood blijven aparte API-events", () => {
	const view = viewFor(1381916);
	assert.equal(view.round, "Eerste Divisie - Ronde 1");
	const cards = view.timeline.filter(item => item.player === "Jorn Berkhout");
	assert.deepEqual(cards.map(item => [item.minute, item.label]), [
		["13′", "Gele kaart"], ["62′", "Gele kaart"], ["62′", "Rode kaart"],
	]);
});

test("uitwinst toont drie punten en teamcijfers", () => {
	const view = viewFor(1552187);
	assert.equal(view.pointsText, "+3 competitiepunten");
	assert.equal(view.stats.find(item => item.label === "Schoten op doel").away, "4");
});

test("bekerwedstrijd krijgt geen competitiepunten", () => {
	const view = viewFor(1477456);
	assert.equal(view.pointsText, "Bekerwedstrijd · geen competitiepunten");
	assert.equal(view.round, "Beker - 2e voorronde");
	assert.equal(view.timeline.filter(item => item.type === "Goal").at(-1).score, "3–2");
});

test("AZ: basiself, trainer en invallers komen uit de opgeslagen API-data", () => {
	const view = viewFor(1552195);
	const cambuur = view.lineups[0];
	assert.equal(cambuur.name, "SC Cambuur");
	assert.equal(cambuur.formation, "4-2-3-1");
	assert.equal(cambuur.coach, "J. Plat");
	assert.equal(cambuur.starters.length, 11);
	assert.deepEqual(cambuur.starters.find(player => player.number === 2), {
		name: "D. Bouah", number: 2, position: "Verdediger", fieldPosition: "Verdediger", grid: "2:4", minutes: "53′", rating: "5,16", details: ["1× rood"],
	});
	assert.equal(cambuur.starters.find(player => player.grid === "1:1").fieldPosition, "Keeper");
	assert.equal(cambuur.starters.find(player => player.grid === "4:3").fieldPosition, "Middenveld");
	assert.equal(cambuur.starters.find(player => player.grid === "5:1").fieldPosition, "Aanval");
	const mulders = cambuur.substitutions.find(player => player.number === 16);
	assert.equal(mulders.entered, "57′");
	assert.equal(mulders.replaced, "Jason Ceka");
	assert.equal(mulders.minutes, "33′");
	assert.equal(mulders.grid, null);
	assert.equal(view.lineups[1].starters.length, 11);
	assert.ok(view.lineups[1].substitutions.some(player => player.name === "Jerolldino Bergraaf"));
});

test("formatie wordt uit complete veldplekken afgeleid", () => {
	const league = viewFor(1381985);
	assert.equal(league.lineups[0].formation, "4-4-2");
	assert.equal(league.lineups[1].formation, "4-3-3");
	const cup = viewFor(1477456);
	assert.equal(cup.lineups[0].formation, null);
	assert.equal(cup.lineups[0].starters[0].fieldPosition, "Keeper");
});

test("ontbrekende spelerstatistiek wordt niet uit het wisselmoment afgeleid", () => {
	const view = viewFor(1381985);
	const jonker = view.lineups.flatMap(team => team.substitutions)
		.find(player => player.name === "T. Jonker");
	assert.ok(jonker);
	assert.equal(jonker.minutes, "–");
	assert.equal(jonker.rating, "–");
	assert.notEqual(jonker.entered, "–");
});
