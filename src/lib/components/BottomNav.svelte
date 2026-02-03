<script lang="ts">
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import Home from "$lib/components/icons/Home.svelte";
	import Users from "$lib/components/icons/Users.svelte";
	import List from "$lib/components/icons/List.svelte";
	import Globe from "$lib/components/icons/Globe.svelte";
	import Heart from "$lib/components/icons/Heart.svelte";

	const links = [
		{
			href: resolve("/"),
			label: "Accueil",
			component: Home,
			match: (path: string) => path === resolve("/"),
		},
		{
			href: resolve("/associations"),
			label: "Assos",
			component: Users,
			match: (path: string) => path.startsWith(resolve("/associations")),
		},
		{
			href: resolve("/lists"),
			label: "Listes",
			component: List,
			match: (path: string) => path.startsWith(resolve("/lists")),
		},
		{
			href: resolve("/autres-sites"),
			label: "Sites",
			component: Globe,
			match: (path: string) => path.startsWith(resolve("/autres-sites")),
		},
		{
			href: resolve("/partenariats"),
			label: "Partenaires",
			component: Heart,
			match: (path: string) => path.startsWith(resolve("/partenariats")),
		},
	];
</script>

<nav class="bottom-nav">
	{#each links as link (link.href)}
		<a
			href={link.href}
			class="nav-item"
			class:active={link.match(page.url.pathname)}
			aria-current={link.match(page.url.pathname) ? "page" : undefined}
		>
			<span class="icon">
				<link.component width="24" height="24" class="icon" />
			</span>
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
		height: 4rem;
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

	@media (max-width: 1200px) {
		.bottom-nav {
			display: flex;
		}
	}
</style>
