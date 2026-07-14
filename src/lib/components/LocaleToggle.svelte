<script lang="ts">
	import { getLocale, setLocale, locales } from "$lib/paraglide/runtime";
	import { m } from "$lib/paraglide/messages";

	// Cycle to the next locale (fr <-> en). setLocale reloads the page to apply
	// the new language everywhere.
	function toggle() {
		const current = getLocale();
		const next = locales[(locales.indexOf(current) + 1) % locales.length];
		setLocale(next);
	}
</script>

<button
	onclick={toggle}
	class="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-mines-platinum transition-colors border border-white/10 focus:outline-none focus:ring-2 focus:ring-mines-gold shadow-sm text-xs font-bold uppercase"
	aria-label={m.language_toggle()}
>
	{getLocale()}
</button>
