<script lang="ts">
	import { page } from "$app/state";
	import logo from "$lib/assets/logo.png";
	import { SITE_NAME } from "$lib/site";
	import Button from "$lib/components/Button.svelte";

	const nav = [
		{ href: "/", label: "Accueil" },
		{ href: "/associations", label: "Associations" },
		{ href: "/lists", label: "Listes" },
		{ href: "/liens", label: "Liens" },
	];

	let menuOpen = $state(false);

	function isActive(href: string): boolean {
		if (href === "/") return page.url.pathname === "/";
		return page.url.pathname.startsWith(href);
	}
</script>

<header class="sticky top-0 z-50 glass-panel border-b border-white/10 shadow-md">
	<div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between h-20">
		<!-- Brand -->
		<a
			class="flex items-center gap-3 z-50 relative group"
			href="/"
			onclick={() => (menuOpen = false)}
		>
			<img
				src={logo}
				alt="Logo {SITE_NAME}"
				class="w-10 h-10 rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
			/>
			<span
				class="font-heading font-bold text-xl text-mines-platinum tracking-tight transition-colors duration-200 group-hover:text-white"
			>
				{SITE_NAME}
			</span>
		</a>

		<!-- Desktop Nav -->
		<nav class="hidden md:flex items-center gap-6" aria-label="Navigation principale">
			<div class="flex items-center gap-2">
				{#each nav as item}
					<a
						href={item.href}
						class="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 {isActive(
							item.href
						)
							? 'bg-white/10 text-mines-gold font-semibold'
							: 'text-mines-platinum/80 hover:bg-white/5 hover:text-white'}"
						aria-current={isActive(item.href) ? "page" : undefined}
					>
						{item.label}
					</a>
				{/each}
			</div>

			<div class="pl-6 border-l border-white/20">
				<Button
					href="https://canari-emse.fr"
					variant="primary"
					class="!px-5 !py-2 text-sm"
					target="_blank"
					rel="noopener noreferrer"
				>
					Ouvrir Canari
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						class="ml-2 opacity-90 group-hover:translate-x-1 transition-transform"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline
							points="15 3 21 3 21 9"
						></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg
					>
				</Button>
			</div>
		</nav>

		<!-- Mobile Burger -->
		<button
			class="md:hidden z-50 p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-mines-gold"
			aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
			aria-expanded={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<div class="relative w-6 h-4">
				<span
					class="absolute left-0 w-full h-0.5 bg-mines-platinum rounded transition-all duration-300 {menuOpen
						? 'top-1/2 -translate-y-1/2 rotate-45'
						: 'top-0'}"
				></span>
				<span
					class="absolute left-0 w-full h-0.5 bg-mines-platinum rounded transition-all duration-300 top-1/2 -translate-y-1/2 {menuOpen
						? 'opacity-0 scale-0'
						: 'opacity-100'}"
				></span>
				<span
					class="absolute left-0 w-full h-0.5 bg-mines-platinum rounded transition-all duration-300 {menuOpen
						? 'top-1/2 -translate-y-1/2 -rotate-45'
						: 'bottom-0'}"
				></span>
			</div>
		</button>
	</div>

	<!-- Mobile Nav -->
	<div
		class="md:hidden absolute top-full left-0 w-full px-4 pb-4 transition-all duration-300 origin-top {menuOpen
			? 'scale-100 opacity-100 pointer-events-auto'
			: 'scale-95 opacity-0 pointer-events-none'}"
	>
		<div
			class="bg-mines-navy/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2"
		>
			{#each nav as item}
				<a
					href={item.href}
					class="block px-4 py-3 rounded-xl font-medium transition-colors {isActive(item.href)
						? 'bg-white/10 text-mines-gold'
						: 'text-mines-platinum/90 hover:bg-white/5'}"
					aria-current={isActive(item.href) ? "page" : undefined}
					onclick={() => (menuOpen = false)}
				>
					{item.label}
				</a>
			{/each}
			<div class="mt-4 pt-4 border-t border-white/10">
				<Button
					href="https://canari-emse.fr"
					variant="primary"
					class="w-full"
					target="_blank"
					rel="noopener noreferrer"
				>
					Ouvrir Canari
				</Button>
			</div>
		</div>
	</div>
</header>
