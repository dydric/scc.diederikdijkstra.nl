import { turf } from "../modules/scc/turf.js";

const board = document.querySelector("[data-upcoming]");

if (board) {
	const stage = board.querySelector("[data-upcoming-stage]");
	const empty = board.querySelector("[data-upcoming-empty]");
	const next = board.querySelector("[data-upcoming-next]");
	const date = board.querySelector("[data-upcoming-date]");
	const time = board.querySelector("[data-upcoming-time]");
	const home = board.querySelector("[data-upcoming-home]");
	const away = board.querySelector("[data-upcoming-away]");
	const context = board.querySelector("[data-upcoming-context]");
	const teams = board.querySelector(".scc-upcoming-teams");
	const countdown = board.querySelector("[data-upcoming-countdown]");
	const when = board.querySelector("[data-upcoming-when]");
	const clock = board.querySelector("[data-upcoming-clock]");
	// Het voetbalveld onder de hero (css/components/scc-turf.css); de aftrap
	// bepaalt avond- of middaglicht en verandert mee met het programma.
	const main = board.querySelector("[data-turf]");
	const field = main && turf([main]);
	const units = Object.fromEntries([...clock.querySelectorAll("[data-unit]")]
		.map(node => [node.dataset.unit, node]));
	const cell = (tag, value) => {
		const node = document.createElement(tag);
		node.textContent = value;
		return node;
	};
	const formStrip = value => {
		const box = document.createElement("span");
		box.className = "scc-preview-form";
		box.setAttribute("aria-label", `Laatste ${value.length} competitiewedstrijden, oud naar nieuw`);
		for (const letter of value) {
			const part = cell("span", ({ W: "W", D: "G", L: "V" })[letter]);
			part.dataset.result = ({ W: "winst", D: "gelijk", L: "verlies" })[letter];
			part.title = ({ W: "Gewonnen", D: "Gelijk", L: "Verloren" })[letter];
			box.append(part);
		}
		return box;
	};
	const renderPreview = first => {
		const preview = first?.preview;
		for (const side of ["home", "away"]) {
			const team = preview?.[side];
			const target = board.querySelector(`[data-preview-team="${side}"]`);
			const position = cell("p", team?.rank != null ? `${team.rank}e · ${team.points} punten · ${team.played} gespeeld` : "");
			position.className = "scc-preview-standing";
			const form = team?.form ? formStrip(team.form) : cell("p", "Vorm niet beschikbaar");
			if (!team?.form) form.className = "scc-preview-note";
			target.replaceChildren(...(team?.rank != null ? [position, form] : [form]));
		}
		board.querySelector("[data-preview-standings-date]").textContent = preview?.standingsAt ? `Stand bijgewerkt ${preview.standingsUpdated}` : "";
		const panel = board.querySelector("[data-preview-prediction]");
		panel.hidden = !preview?.prediction || Date.parse(first?.date) <= Date.now();
		if (panel.hidden) return;
		board.querySelector("[data-preview-chances]").replaceChildren(...["home", "draw", "away"].map(side => {
			const item = document.createElement("div");
			const label = cell("span", `${side === "draw" ? "Gelijk" : first[side]} `);
			label.className = "sr-only";
			item.append(label, cell("strong", `${preview.prediction[side]}%`));
			return item;
		}));
		board.querySelector("[data-preview-bar]").replaceChildren(...["home", "draw", "away"].map(side => {
			const item = document.createElement("span");
			item.dataset.side = side;
			item.toggleAttribute("data-cambuur", first[side] === "SC Cambuur");
			item.style.width = `${preview.prediction[side]}%`;
			return item;
		}));
	};
	// Een tekst als klaptegels, net als flapText in partials/scc/ui.njk; alleen
	// voor de aftelklok.
	const flaps = (el, value) => {
		if (el.firstElementChild?.getAttribute("aria-label") === value) return;
		const box = document.createElement("span");
		box.className = "scc-flaps";
		box.setAttribute("aria-label", value);
		box.append(...[...value].map(char => {
			const tile = cell("span", char);
			tile.setAttribute("aria-hidden", "true");
			if (char === " ") tile.setAttribute("data-space", "");
			return tile;
		}));
		el.replaceChildren(box);
	};
	const amsterdamDay = value => {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
		}).formatToParts(value);
		const part = type => parts.find(item => item.type === type)?.value;
		return `${part("year")}-${part("month")}-${part("day")}`;
	};

	// De aftelklok tot de aftrap van de eerstvolgende wedstrijd. Na de aftrap
	// staat er twee uur lang "Bezig"; daarna verdwijnt de klok tot de
	// volgende verversing van het programma.
	const MATCH = 2 * 60 * 60 * 1000;
	let kickoff = null;
	let timer = 0;
	let spoken = "";
	const tick = () => {
		const left = kickoff - Date.now();
		if (left <= 0) board.querySelector("[data-preview-prediction]").hidden = true;
		if (!Number.isFinite(left) || left <= -MATCH) {
			countdown.hidden = true;
			clearInterval(timer);
			return;
		}
		countdown.hidden = false;
		const live = left <= 0;
		countdown.toggleAttribute("data-live", live);
		if (live) {
			flaps(clock, "BEZIG");
			countdown.setAttribute("aria-label", "De wedstrijd is bezig");
			return;
		}
		if (!clock.contains(units.days)) clock.replaceChildren(...Object.values(units).map(node => node.parentElement));
		const seconds = Math.floor(left / 1000);
		const parts = {
			days: Math.floor(seconds / 86400),
			hours: Math.floor(seconds / 3600) % 24,
			minutes: Math.floor(seconds / 60) % 60,
			seconds: seconds % 60,
		};
		for (const [unit, value] of Object.entries(parts)) {
			flaps(units[unit], String(value).padStart(2, "0"));
		}
		// Voorlezen per minuut, niet per seconde.
		const label = `Aftrap over ${parts.days} dagen, ${parts.hours} uur en ${parts.minutes} minuten`;
		if (label !== spoken) countdown.setAttribute("aria-label", spoken = label);
	};
	const start = value => {
		clearInterval(timer);
		kickoff = value ? new Date(value).getTime() : NaN;
		tick();
		if (!countdown.hidden) timer = setInterval(tick, 1000);
	};

	const render = rows => {
		const first = rows[0];
		stage.hidden = !first;
		teams.toggleAttribute("data-long-names", Math.max(first?.home.length || 0, first?.away.length || 0) > 11);
		empty.hidden = Boolean(first);
		context.hidden = !first;
		when.hidden = !first;
		if (first) {
			date.dateTime = first.date;
			date.textContent = first.day;
			time.textContent = first.time;
			home.textContent = first.home;
			away.textContent = first.away;
			home.toggleAttribute("data-cambuur", first.home === "SC Cambuur");
			away.toggleAttribute("data-cambuur", first.away === "SC Cambuur");
			context.textContent = first.context;
		}
		start(first?.date);
		renderPreview(first);
		if (field) {
			main.dataset.kickoff = first?.date ?? "";
			field.update(main);
		}
		next.replaceChildren(...rows.slice(1).map(row => {
			const item = document.createElement("li");
			item.className = "scc-upcoming-next-row";
			const dateCell = cell("time", `${row.day} · ${row.time}`);
			dateCell.dateTime = row.date;
			dateCell.className = "scc-list-date";
			const match = document.createElement("span");
			match.className = "scc-upcoming-next-match";
			match.append(...["home", "away"].map(side => {
				const name = cell("span", row[side]);
				name.toggleAttribute("data-cambuur", row[side] === "SC Cambuur");
				return name;
			}));
			match.insertBefore(document.createTextNode("\u00a0– "), match.lastChild);
			const meta = document.createElement("span");
			meta.className = "scc-upcoming-next-meta";
			meta.append(cell("span", row.context));
			item.append(dateCell, match, meta);
			return item;
		}));
	};

	// Verberg een verlopen statische beginstand voordat de Netlify-data binnenkomt.
	if (date.dateTime && amsterdamDay(new Date(date.dateTime)) < amsterdamDay(new Date())) {
		stage.hidden = true;
		when.hidden = true;
		board.querySelector("[data-preview-prediction]").hidden = true;
		empty.hidden = false;
		next.replaceChildren();
	} else if (date.dateTime) {
		start(date.dateTime);
	}
	fetch("/.netlify/functions/scc-upcoming")
		.then(response => {
			if (!response.ok) throw new Error("Programma niet beschikbaar");
			return response.json();
		})
		.then(data => { if (Array.isArray(data.rows)) render(data.rows); })
		.catch(() => {});
}
