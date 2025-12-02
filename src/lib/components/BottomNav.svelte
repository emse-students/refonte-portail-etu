<script lang="ts">
	import { page } from "$app/state";
	import { resolve } from "$app/paths";

	const links = [
		{
			href: resolve("/"),
			label: "Accueil",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
			match: (path: string) => path === resolve("/"),
		},
		{
			href: resolve("/associations"),
			label: "Assos",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
			match: (path: string) => path.startsWith(resolve("/associations")),
		},
		{
			href: resolve("/lists"),
			label: "Listes",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
			match: (path: string) => path.startsWith(resolve("/lists")),
		},
		{
			href: resolve("/autres-sites"),
			label: "Sites",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
			match: (path: string) => path.startsWith(resolve("/autres-sites")),
		},
		{
			href: resolve("/partenariats"),
			label: "Partenaires",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
			match: (path: string) => path.startsWith(resolve("/partenariats")),
		},
	];
</script>

<nav class="bottom-nav">
	{#each links as link}
		<a
			href={link.href}
			class="nav-item"
			class:active={link.match(page.url.pathname)}
			aria-current={link.match(page.url.pathname) ? "page" : undefined}
		>
			<span class="icon">{@html link.icon}</span>
			<span class="label">{link.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		display: none;
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background: var(--color-primary);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.5rem 0;
		padding-bottom: env(safe-area-inset-bottom, 0.5rem);
		z-index: 1000;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
		justify-content: space-around;
		align-items: center;
		backdrop-filter: blur(10px);
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.7rem;
		gap: 0.25rem;
		flex: 1;
		padding: 0.25rem;
		transition: all 0.2s ease;
		border-radius: 8px;
	}

	.nav-item:hover {
		color: rgba(255, 255, 255, 0.9);
	}

	.nav-item.active {
		color: var(--color-secondary);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon :global(svg) {
		width: 24px;
		height: 24px;
	}

	@media (max-width: 768px) {
		.bottom-nav {
			display: flex;
		}
	}
</style>
