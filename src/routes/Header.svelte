<script lang="ts">
	import { pushState } from "$app/navigation";
	import { asset, resolve } from "$app/paths";
	import { page } from "$app/state";
	import type { FullUser } from "$lib/databasetypes";
	import { signIn, signOut } from "@auth/sveltekit/client";

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
			<ul>
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
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #6d28d9 100%);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
		padding: 0 2rem;
		min-height: 64px;
		z-index: 100;
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
		font-size: 1.3rem;
		font-weight: bold;
		color: #f0abfc; /* Rose-violet clair chaleureux */
		letter-spacing: 0.02em;
		white-space: nowrap;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.header-nav {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.header-nav ul {
		display: flex;
		gap: 1.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.header-nav li {
		position: relative;
	}

	.header-nav li[aria-current="page"] a {
		color: #f0abfc;
		font-weight: bold;
		border-bottom: 2px solid #f0abfc;
	}

	header a {
		color: #f3e8ff;
		text-decoration: none;
		font-size: 1rem;
		padding: 0.5rem 0;
		transition: color 0.2s, transform 0.2s;
	}

	header a:hover {
		color: #f0abfc;
	}

	.header-right {
		display: flex;
		align-items: center;
		flex: 1;
		justify-content: flex-end;
	}

	.login-btn {
		background: linear-gradient(135deg, #d946ef 0%, #ec4899 100%);
		color: #ffffff;
		border: none;
		border-radius: 8px;
		padding: 0.6rem 1.4rem;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.3s ease;
		box-shadow: 0 4px 12px rgba(217, 70, 239, 0.3);
		cursor: pointer;
	}

	.login-btn:hover {
		background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
		box-shadow: 0 6px 16px rgba(217, 70, 239, 0.4);
	}

	/* Collapsible menu for mobile */


	@media (max-width: 768px) {
		header {
			padding: 0.5rem 1rem;
		}
		.header-nav {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			transform: none;
		}
		.header-nav > * {
			pointer-events: auto;
		}
		.header-left {
			display: flex;
			align-items: center;
		}
		.mobile-menu-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(255, 255, 255, 0.1);
			border: 2px solid #f0abfc;
			border-radius: 50%;
			width: 48px;
			height: 48px;
			margin-right: 0.5rem;
			font-size: 2rem;
			color: #f0abfc;
			box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
			transition: all 0.3s ease;
			backdrop-filter: blur(10px);
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}
		.mobile-menu-btn:active, .mobile-menu-btn:focus {
			background: #d946ef;
			border-color: #ec4899;
			color: #ffffff;
			outline: none;
		}
		.logo-bde {
			height: 48px;
			width: auto;
			max-width: 80px;
			margin-right: 0;
			border-radius: 10px;
			object-fit: contain;
			background: none;
			box-shadow: none;
			display: block;
			padding: 2px 8px;
		}
		.site-title {
			display: none;
		}
		.nav-drawer {
			position: fixed;
			top: 0;
			left: 0;
			height: 100vh;
			width: 270px;
			background: linear-gradient(180deg, #6d28d9 0%, #5b21b6 100%);
			box-shadow: 2px 0 20px rgba(124, 58, 237, 0.3);
			transform: translateX(-100%);
			transition: transform 0.3s cubic-bezier(.4,0,.2,1);
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
			padding: 0;
		}
		.nav-drawer li {
			padding: 0;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		}
		.nav-drawer li a {
			display: block;
			padding: 1rem 1.5rem;
			color: #f3e8ff;
			font-size: 1.1rem;
			transition: background 0.2s ease;
		}
		.nav-drawer li a:hover {
			background: rgba(255, 255, 255, 0.1);
			text-decoration: none;
		}
		.nav-drawer li[aria-current="page"] a {
			background: rgba(240, 171, 252, 0.2);
			color: #f0abfc;
			font-weight: bold;
			border-left: 4px solid #f0abfc;
			border-bottom: none;
		}
		.nav-overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: rgba(0, 0, 0, 0.5);
			z-index: 150;
			backdrop-filter: blur(2px);
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
