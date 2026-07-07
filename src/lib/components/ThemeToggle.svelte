<script lang="ts">
	import { onMount } from "svelte";
	import { toggleTheme } from "$lib/theme";
	import Sun from "./icons/Sun.svelte";
	import Moon from "./icons/Moon.svelte";

	let isDark = $state(false);

	onMount(() => {
		isDark = document.documentElement.classList.contains("dark");

		// Observer pour suivre les changements de la classe 'dark' faits par d'autres composants
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.attributeName === "class") {
					isDark = document.documentElement.classList.contains("dark");
				}
			}
		});

		observer.observe(document.documentElement, { attributes: true });

		return () => observer.disconnect();
	});
</script>

<button
	onclick={toggleTheme}
	class="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-mines-platinum transition-colors border border-white/10 focus:outline-none focus:ring-2 focus:ring-mines-gold shadow-sm"
	aria-label="Basculer le theme"
>
	{#if isDark}
		<Sun width="20" height="20" class="opacity-80 hover:opacity-100" />
	{:else}
		<Moon width="20" height="20" class="opacity-80 hover:opacity-100" />
	{/if}
</button>
