<script lang="ts">
	import { pushState } from "$app/navigation";
	import { asset, resolve } from "$app/paths";
	import { page } from "$app/state";
	import type { FullUser } from "$lib/databasetypes";
	import { signIn, signOut } from "@auth/sveltekit/client";
	import { onMount, tick } from "svelte";

	// Load the associations and lists from the api

	const data = $props();
	const user = data.user;
	const userData: FullUser | null = data.userData;


	// Mobile nav menu state
	let navOpen = $state(false);

	function openNavWithHistory() {
		if (!navOpen) {
			navOpen = true;
			pushState('', { navMenu: true });
		}
	}

	function closeNav() {
		navOpen = false;
	}

	function toggleNav() {
		if (navOpen) {
			closeNav();
			// If the last history entry was for nav menu, go back
			if (page.state.navMenu) {
				history.back();
			}
		} else {
			openNavWithHistory();
		}
	}

	// Listen for popstate to close menu on back
	if (typeof window !== 'undefined') {
		window.addEventListener('popstate', () => {
			if (navOpen) {
				closeNav();
			}
		});
	}

	// Animated underline indicator
	let navUl: HTMLUListElement;
	let underlineStyle = $state('');

	function updateUnderline() {
		if (typeof window === 'undefined' || !navUl) return;

		const activeItem = navUl.querySelector('li[aria-current="page"]');
		if (activeItem) {
			const link = activeItem.querySelector('a');
			if (link) {
				const ulRect = navUl.getBoundingClientRect();
				const linkRect = link.getBoundingClientRect();
				const left = linkRect.left - ulRect.left;
				const width = linkRect.width;
				underlineStyle = `left: ${left}px; width: ${width}px; opacity: 1;`;
			}
		} else {
			underlineStyle = 'opacity: 0;';
		}
	}

	onMount(() => {
		updateUnderline();
		// Update on window resize
		window.addEventListener('resize', updateUnderline);
		return () => window.removeEventListener('resize', updateUnderline);
	});

	$effect(() => {
		// Update when page changes
		page.url.pathname;
		tick().then(updateUnderline);
	});
</script>

<header class:menu-open={navOpen}>
	<div class="header-left">
		<button aria-label="Menu" aria-haspopup="true" aria-expanded={navOpen} onclick={toggleNav} class="mobile-menu-btn">
			<span class="icon">☰</span>
		</button>
		<a href="/">
			<img src={asset("/logo.png")} alt="Logo BDE EMSE" class="logo-bde" />
			<span class="site-title">Portail des Étudiants</span>
		</a>
	</div>
	<nav class="header-nav">
		<div class="nav-drawer" class:open={navOpen}>
			<ul bind:this={navUl}>
				<li aria-current={page.url.pathname === resolve("/") ? "page" : undefined}>
					<a href={resolve("/")} onclick={closeNav}>Accueil</a>
				</li>
				<li
					aria-current={page.url.pathname.startsWith(resolve("/associations"))
						? "page"
						: undefined}
				>
					<a href={resolve("/associations")} onclick={closeNav}>Associations</a>
				</li>
				<li
					aria-current={page.url.pathname.startsWith(resolve("/lists"))
						? "page"
						: undefined}
				>
					<a href={resolve("/lists")} onclick={closeNav}>Listes</a>
				</li>
				<li
					aria-current={page.url.pathname.startsWith(resolve("/autres-sites"))
						? "page"
						: undefined}
				>
					<a href={resolve("/autres-sites")} onclick={closeNav}>Autres Sites</a>
				</li>
				<li
					aria-current={page.url.pathname.startsWith(resolve("/partenariats"))
						? "page"
						: undefined}
				>
					<a href={resolve("/partenariats")} onclick={closeNav}>Partenariats</a>
				</li>
				<div class="nav-underline" style={underlineStyle}></div>
			</ul>
		</div>
		{#if navOpen}
			<div class="nav-overlay" role="presentation" onclick={toggleNav}></div>
		{/if}
	</nav>
	<div class="header-right">
		{#if user}
			<button onclick={() => signOut()} class="login-btn">Se déconnecter</button>
		{:else}
			<button class="login-btn" onclick={() => signIn("cas-emse")}>Se connecter</button>
		{/if}
	</div>
</header>

<style>
	header {
		position: sticky;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #6d28d9 100%);
		box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
		padding: 0.75rem 2rem;
		min-height: 70px;
		z-index: 100;
		backdrop-filter: blur(10px);
		transition: box-shadow 0.3s ease;
	}

	header:hover {
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.header-left > a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
	}

	.logo-bde {
		height: 48px;
		width: auto;
		object-fit: contain;
	}

	.site-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #ffffff;
		letter-spacing: -0.01em;
		white-space: nowrap;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		transition: color 0.2s ease;
	}

	.header-left > a:hover .site-title {
		color: #f0abfc;
	}

	.header-nav {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.header-nav ul {
		display: flex;
		gap: 2rem;
		list-style: none;
		margin: 0;
		padding: 0;
		position: relative;
	}

	.header-nav li {
		position: relative;
	}

	.header-nav li[aria-current="page"] a {
		color: #ffffff;
		font-weight: 600;
	}

	.nav-underline {
		position: absolute;
		bottom: -4px;
		height: 2px;
		background: #f0abfc;
		border-radius: 2px;
		transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
		pointer-events: none;
		opacity: 0;
	}

	header a {
		color: rgba(255, 255, 255, 0.9);
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 500;
		padding: 0.5rem 0;
		position: relative;
		transition: color 0.2s ease;
	}

	header a:hover {
		color: #ffffff;
	}

	.header-right {
		display: flex;
		align-items: center;
		flex: 1;
		justify-content: flex-end;
	}

	.login-btn {
		background: rgba(255, 255, 255, 0.15);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		padding: 0.5rem 1.25rem;
		font-size: 0.95rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		backdrop-filter: blur(10px);
	}

	.login-btn:hover {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.5);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	/* Collapsible menu for mobile */


	@media (max-width: 768px) {
		header {
			padding: 0.75rem 1rem;
		}
		.header-nav {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			transform: none;
			z-index: 100;
		}
		.header-nav > * {
			pointer-events: auto;
		}
		.header-left {
			display: flex;
			align-items: center;
			z-index: 210;
			position: relative;
		}
		.header-right {
			z-index: 50;
			position: relative;
		}
		.mobile-menu-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(255, 255, 255, 0.15);
			border: 1px solid rgba(255, 255, 255, 0.3);
			border-radius: 8px;
			width: 40px;
			height: 40px;
			margin-right: 0.75rem;
			font-size: 1.5rem;
			color: white;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			transition: all 0.2s ease;
			backdrop-filter: blur(10px);
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}
		.mobile-menu-btn:active, .mobile-menu-btn:focus {
			background: rgba(255, 255, 255, 0.25);
			border-color: rgba(255, 255, 255, 0.5);
			outline: none;
		}
		.logo-bde {
			height: 40px;
			width: auto;
			max-width: 70px;
			object-fit: contain;
			border-radius: 8px;
		}
		.site-title {
			display: none;
		}
		.nav-drawer {
			position: fixed;
			top: 0;
			left: 0;
			height: 100vh;
			width: 280px;
			background: linear-gradient(180deg, #6d28d9 0%, #5b21b6 100%);
			box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
			transform: translateX(-100%);
			transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			z-index: 200;
			display: flex;
			flex-direction: column;
			padding-top: 80px;
			overflow-y: auto;
		}
		.nav-drawer.open {
			transform: translateX(0);
		}
		.nav-drawer ul {
			flex-direction: column;
			gap: 0;
			list-style: none;
			margin: 0;
			padding: 1rem;
		}
		.nav-drawer li {
			padding: 0;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		}
		.nav-drawer li:last-of-type {
			border-bottom: none;
		}
		.nav-drawer li a {
			display: block;
			padding: 1rem 1.25rem;
			color: rgba(255, 255, 255, 0.9);
			font-size: 1rem;
			font-weight: 500;
			transition: all 0.2s ease;
		}
		.nav-drawer li a:hover {
			background: rgba(255, 255, 255, 0.15);
			color: white;
			text-decoration: none;
		}
		.nav-drawer li[aria-current="page"] a {
			background: rgba(240, 171, 252, 0.2);
			color: #f0abfc;
			font-weight: 600;
			border-left: 3px solid #f0abfc;
		}
		.nav-overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: rgba(0, 0, 0, 0.6);
			z-index: 150;
			backdrop-filter: blur(4px);
		}
	}


	/* Hide menu button on desktop, show only on mobile */
	.mobile-menu-btn {
		display: none;
	}
	@media (max-width: 768px) {
		.mobile-menu-btn {
			display: flex;
		}
	}
</style>
