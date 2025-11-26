export function of(str: string) {
	const vowels = ["A", "E", "I", "O", "U", "Y"];
	return vowels.includes(str[0].toUpperCase()) ? "d'" : "de ";
}
