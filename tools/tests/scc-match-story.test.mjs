import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matchStory, ratingBand, shortName } from "../../src/lib/scc-match-story.js";
import { archive } from "../../src/lib/scc-archive.js";

function storyFor(id, extraData = {}) {
	const match = JSON.parse(readFileSync(`src/scc/api/${id}.json`, "utf8")).response[0];
	return matchStory({ data: {
		match,
		home: match.teams.home.id === 420 ? "SC Cambuur" : match.teams.home.name,
		away: match.teams.away.id === 420 ? "SC Cambuur" : match.teams.away.name,
		score: match.goals,
		matchDate: match.fixture.date.slice(0, 10),
		...extraData,
	} });
}

test("AZ: goals, ruststand en de stand vanuit Cambuur", () => {
	const story = storyFor(1552195);
	assert.equal(story.halftime, "2–1");
	assert.deepEqual(story.goals.map(goal => `${goal.minute} ${goal.score.text}`), ["7′ 1–0", "26′ 1–1", "39′ 2–1", "83′ 2–2"]);
	assert.equal(story.goals[3].kind, "penalty");
	assert.deepEqual(story.states.map(state => state.state), ["gelijk", "voor", "gelijk", "voor", "gelijk"]);
	assert.equal(story.result, "gelijk");
});

test("eigen doelpunten volgen de ploeg die ervan profiteert", () => {
	const jongAz = storyFor(1381942);
	assert.deepEqual(jongAz.goals.map(goal => [goal.side, goal.score.text]), [["away", "0–1"]]);
	assert.deepEqual([jongAz.goals[0].playerSide, jongAz.goals[0].playerTeam], ["home", "Jong AZ"]);
	assert.deepEqual(jongAz.states.map(state => state.state), ["gelijk", "voor"]);
	assert.equal(jongAz.strip.find(item => item.kind === "owngoal").displaySide, "home");
	const willemIi = storyFor(1381955);
	assert.equal(willemIi.goals[0].score.text, "0–1");
	assert.equal(willemIi.goals[0].playerSide, "home");
	assert.equal(willemIi.states[1].state, "achter");
	const feyenoord = storyFor(1552141);
	assert.equal(feyenoord.goals.find(goal => goal.kind === "owngoal").score.text, "0–3");
	assert.equal(feyenoord.goals.find(goal => goal.kind === "owngoal").playerSide, "home");
});

test("archief telt een eigen doelpunt voor de profiterende ploeg", () => {
	const match = JSON.parse(readFileSync("src/scc/api/1381942.json", "utf8")).response[0];
	const item = { data: { match, matchDate: "2025-08-25", matchUrl: "/2025-08-25-jong-az/",
		title: "Jong AZ – SC Cambuur", home: "Jong AZ", away: "SC Cambuur",
		score: match.goals, competition: "Eerste Divisie", season: "2025-2026" } };
	const result = archive([item]);
	assert.deepEqual([result.profile[1].for, result.profile[1].against], [1, 0]);
	assert.deepEqual(result.groups[0].rows[0].states.map(state => state.state), ["gelijk", "voor"]);
});

test("AZ: veldplekken, cijfers en uitblinker", () => {
	const story = storyFor(1552195);
	const cambuur = story.pitch.find(team => team.cambuur);
	assert.equal(cambuur.formation, "4-2-3-1");
	const binder = cambuur.players.find(player => player.short === "Binder");
	assert.deepEqual([binder.x, binder.y, binder.band, binder.goals[0]], [50, 100, "uitblinker", "7′"]);
	assert.equal(cambuur.players.find(player => player.short === "Bouah").red[0], "53′");
	assert.equal(story.motm.name, "N. Binder");
});

test("rapportcijfer: band volgt het afgeronde cijfer", () => {
	assert.equal(ratingBand(5.96), "krap");
	assert.equal(ratingBand(5.94), "onvoldoende");
	assert.equal(ratingBand(6.95), "goed");
	assert.equal(ratingBand(8), "uitblinker");
	assert.equal(ratingBand(null), null);
	assert.equal(shortName("Nicolas Binder"), "Binder");
	assert.equal(shortName("R. El Arguioui"), "El Arguioui");
	assert.equal(shortName("Billy van Duijl"), "van Duijl");
});

test("RKC-beker zonder veldplekken: geen veld, wel cijfers", () => {
	const story = storyFor(1477456);
	assert.ok(story.pitch.every(team => !team.complete));
	assert.ok(story.pitch.every(team => team.ratings.some(player => player.rating)));
});

test("archief: totalen en vorm van oud naar nieuw", () => {
	const item = (date, home, away, h, a, competition = "Eredivisie") => ({ data: {
		matchDate: date, matchUrl: `/${date}/`, title: `${home} – ${away}`, home, away,
		score: { home: h, away: a }, competition, season: "2026-2027", match: null,
	} });
	const result = archive([
		item("2026-08-07", "SC Cambuur", "Excelsior", 0, 4),
		item("2026-08-15", "Fortuna Sittard", "SC Cambuur", 1, 3),
		item("2026-08-23", "SC Cambuur", "Feyenoord", 2, 2),
	]);
	assert.deepEqual([result.tally.wins, result.tally.draws, result.tally.losses, result.tally.points], [1, 1, 1, 4]);
	assert.deepEqual(result.groups[0].form.map(row => row.letter), ["V", "W", "G"]);
	assert.equal(result.groups[0].rows[0].opponent, "Feyenoord");
});

test("dikke lijn: zonder wissels, met goals en kaarten", () => {
	const story = storyFor(1552195);
	assert.ok(story.strip.every(item => item.kind !== "sub"));
	assert.deepEqual(story.strip.filter(item => item.goal).map(item => item.minute), ["7′", "26′", "39′", "83′"]);
	assert.ok(story.strip.some(item => item.kind === "var"));
	assert.equal(story.stripTeams.home.length + story.stripTeams.away.length, story.strip.length);
	assert.ok(story.stripTeams.home.every(item => item.displaySide === "home"));
	assert.ok(story.stripTeams.away.every(item => item.displaySide === "away"));
	assert.equal(story.played, 90);
	assert.deepEqual([story.facts.shotsOn.cambuur, story.facts.red.cambuur], [6, 1]);
});

test("archief per seizoen: beker door of uit, gedeelde topscorers", () => {
	const fixture = id => JSON.parse(readFileSync(`src/scc/api/${id}.json`, "utf8")).response[0];
	const item = (id, competition) => {
		const match = fixture(id);
		const home = match.teams.home.id === 420;
		return { data: { match, matchDate: match.fixture.date.slice(0, 10), matchUrl: `/${id}/`, title: "x",
			home: home ? "SC Cambuur" : match.teams.home.name, away: home ? match.teams.away.name : "SC Cambuur",
			score: match.goals, competition, season: "2025-2026" } };
	};
	const result = archive([item(1381916, "Eerste Divisie"), item(1477456, "KNVB Beker")]);
	const cup = result.groups[0].rows.find(row => row.cup);
	assert.equal(cup.advanced, false);
	const stats = result.groups[0].stats;
	assert.ok(stats.topScorers.every(item => item.count === stats.topScorers[0].count));
	assert.ok(stats.nextScorers.every(item => item.count < stats.topScorers[0].count));
});

test("gespeelde minuten: 90 plus blessuretijd uit de wedstrijddata", () => {
	assert.equal(storyFor(1381916).playedText, "90′+7"); // status.extra
	assert.equal(storyFor(1552160).playedText, "90′+12"); // geen extra, laatste moment
	assert.equal(storyFor(1552195).playedText, "90′+"); // onbekend
});
