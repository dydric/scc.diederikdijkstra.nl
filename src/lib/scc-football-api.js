// Alleen voor import en geplande Netlify-functies; nooit vanuit de browser.
export function footballClient({ key, fetcher = fetch, maximum = 3, deadline = Infinity, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
	let calls = 0;
	let remaining = null;
	return {
		get calls() { return calls; },
		get remaining() { return remaining; },
		async get(endpoint, params) {
			if (!key) throw new Error("API_FOOTBALL_KEY ontbreekt.");
			if (calls >= maximum || (remaining !== null && remaining <= 10)) throw new Error("API-verzoekenbudget bereikt; tien verzoeken blijven gereserveerd.");
			if (Date.now() + (calls ? 6500 : 0) + 5000 > deadline) throw new Error("Tijdbudget bereikt; resterend werk volgt morgen.");
			if (calls) await pause(6500);
			calls++;
			const response = await fetcher(`https://v3.football.api-sports.io/${endpoint}?${new URLSearchParams(params)}`, {
				headers: { "x-apisports-key": key }, signal: AbortSignal.timeout(5000),
			});
			const quota = response.headers.get("x-ratelimit-requests-remaining");
			if (quota !== null && Number.isFinite(Number(quota))) remaining = Number(quota);
			if (!response.ok) throw new Error(`API-Football HTTP ${response.status}.`);
			const raw = await response.text();
			if (raw.includes(key)) throw new Error("API-respons bevat vertrouwelijke gegevens.");
			const data = JSON.parse(raw);
			if (data.errors && Object.keys(data.errors).length) {
				const blocked = /plan|season|subscription|access/i.test(JSON.stringify(data.errors));
				const error = new Error(blocked ? "Geen toegang binnen het API-abonnement." : "API-Football meldt een fout.");
				error.blocked = blocked;
				throw error;
			}
			if (!Array.isArray(data.response) || data.paging?.total > 1) throw new Error("Onvolledige API-respons.");
			return data.response;
		},
	};
}
