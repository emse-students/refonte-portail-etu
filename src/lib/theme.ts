import { browser } from "$app/environment";

export function toggleTheme() {
	if (!browser) return;

	const html = document.documentElement;
	if (html.classList.contains("dark")) {
		html.classList.remove("dark");
		localStorage.theme = "light";
	} else {
		html.classList.add("dark");
		localStorage.theme = "dark";
	}
}

export function initTheme() {
	if (!browser) return;

	// On mount, ensure the Svelte state matches what the anti-FOUC script set
	// Nothing strictly needs to be stored if we just rely on the DOM class,
	// but if we used a store we would sync it here.
}
