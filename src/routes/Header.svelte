<script lang="ts">
	import { page } from "$app/state";
	import logo from "$lib/assets/logo.png";
	import { SITE_NAME } from "$lib/site";

	/** Primary navigation entries of the showcase. */
	const nav = [
		{ href: "/", label: "Accueil" },
		{ href: "/associations", label: "Associations" },
		{ href: "/lists", label: "Listes" },
		{ href: "/liens", label: "Liens" },
	];

	let menuOpen = $state(false);

	/** True when the current path belongs to the given nav entry. */
	function isActive(href: string): boolean {
		if (href === "/") return page.url.pathname === "/";
		return page.url.pathname.startsWith(href);
	}
</script>

<header>
	<div class="bar">
		<a class="brand" href="/" onclick={() => (menuOpen = false)}>
			<img src={logo} alt="" width="40" height="40" />
			<span>{SITE_NAME}</span>
		</a>

		<nav class:open={menuOpen} aria-label="Navigation principale">
			{#each nav as item}
				<a
					href={item.href}
					aria-current={isActive(item.href) ? "page" : undefined}
					onclick={() => (menuOpen = false)}
				>
					{item.label}
				</a>
			{/each}
			<a class="cta" href="https://canari-emse.fr" target="_blank" rel="noopener noreferrer">
				Ouvrir Canari
			</a>
		</nav>

		<button
			class="burger"
			aria-label="Menu"
			aria-expanded={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span></span><span></span><span></span>
		</button>
	</div>
</header>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: rgba(253, 252, 245, 0.85);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--color-bg-2);
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0.75rem 1.5rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.7rem;
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--color-primary);
		letter-spacing: -0.01em;
	}

	.brand img {
		border-radius: 8px;
		object-fit: contain;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	nav a {
		padding: 0.5rem 0.85rem;
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: 0.95rem;
		color: var(--color-text-light);
		transition:
			color 0.2s ease,
			background 0.2s ease;
	}

	nav a:hover {
		color: var(--color-primary);
		background: var(--color-bg-1);
	}

	nav a[aria-current="page"] {
		color: var(--color-primary);
		font-weight: 600;
	}

	nav a.cta {
		margin-left: 0.4rem;
		background: var(--color-primary);
		color: var(--color-text-on-primary);
		font-weight: 600;
	}

	nav a.cta:hover {
		background: var(--color-primary-light);
		color: #fff;
	}

	.burger {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		padding: 0.4rem;
	}

	.burger span {
		width: 24px;
		height: 2px;
		background: var(--color-primary);
		border-radius: 2px;
	}

	@media (max-width: 820px) {
		.burger {
			display: flex;
		}

		nav {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			flex-direction: column;
			align-items: stretch;
			gap: 0.25rem;
			padding: 0.75rem 1.5rem 1.25rem;
			background: var(--color-bg-0);
			border-bottom: 1px solid var(--color-bg-2);
			box-shadow: var(--shadow-lg);
			transform: translateY(-8px);
			opacity: 0;
			pointer-events: none;
			transition:
				opacity 0.2s ease,
				transform 0.2s ease;
		}

		nav.open {
			transform: translateY(0);
			opacity: 1;
			pointer-events: auto;
		}

		nav a {
			padding: 0.7rem 0.85rem;
		}

		nav a.cta {
			margin-left: 0;
			text-align: center;
			margin-top: 0.35rem;
		}
	}
</style>
