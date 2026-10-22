// Controleert bij de build of een YouTube-video nog bestaat en openbaar is.
// Verwijderd of privé: oEmbed antwoordt 401/403/404. Bij netwerkfouten of
// andere statussen blijft de video staan; een storing mag hem niet verbergen.
const cache = new Map();

export function youtubeId(videoUrl) {
	try {
		const url = new URL(videoUrl);
		if (!["youtube.com", "www.youtube.com"].includes(url.hostname) || url.pathname !== "/watch") return null;
		const id = url.searchParams.get("v");
		return /^[A-Za-z0-9_-]{11}$/.test(id ?? "") ? id : null;
	} catch {
		return null;
	}
}

async function check(id) {
	const watch = `https://www.youtube.com/watch?v=${id}`;
	try {
		const response = await fetch(
			`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`,
			{ signal: AbortSignal.timeout(8000) },
		);
		if ([401, 403, 404].includes(response.status)) {
			console.warn(`Video ${id} niet beschikbaar op YouTube (${response.status}); wordt verborgen.`);
			return false;
		}
		return true;
	} catch {
		return true;
	}
}

export function videoAvailable(videoUrl) {
	if (!videoUrl) return Promise.resolve(false);
	const id = youtubeId(videoUrl);
	if (!id) return Promise.resolve(false);
	if (!cache.has(id)) cache.set(id, check(id));
	return cache.get(id);
}
