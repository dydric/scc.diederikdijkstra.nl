const apiNames = {
	"TOP Oss": "FC OSS",
	"Jong FC Utrecht": "Jong Utrecht",
};

export function sameTeamName(left, right) {
	if (typeof left !== "string" || typeof right !== "string") return false;
	const normalized = value => value.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
	const a = normalized(apiNames[left] ?? left);
	const b = normalized(right);
	return Boolean(a && b) && (a.includes(b) || b.includes(a));
}
