<script lang="ts">
	import { pushState } from "$app/navigation";
	import { page } from "$app/state";
	import logo from "$lib/images/logo_bde.png";

	// Load the associations and lists from the api

	let data = $props();
	let user = data.user;

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
		window.addEventListener('popstate', (event) => {
			if (navOpen && event.state && event.state.navMenu) {
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
			<img src={logo} alt="Logo BDE EMSE" class="logo-bde" />
			<span class="site-title">Portail des Étudiants</span>
		</a>
	</div>
	<nav class="header-nav">
		<div class="nav-drawer" class:open={navOpen}>
			<ul>
				<li aria-current={page.url.pathname === "/" ? "page" : undefined}>
					<a href="/">Accueil</a>
				</li>
				<li
					aria-current={page.url.pathname.startsWith("/associations")
						? "page"
						: undefined}
				>
					<a href="/associations">Associations</a>
				</li>
				<li
					aria-current={page.url.pathname.startsWith("/listes")
						? "page"
						: undefined}
				>
					<a href="/listes">Listes</a>
				</li>
				<li
					aria-current={page.url.pathname.startsWith("/autres-sites")
						? "page"
						: undefined}
				>
					<a href="/autres-sites">Autres Sites</a>
				</li>
				<li
					aria-current={page.url.pathname.startsWith("/partenariats")
						? "page"
						: undefined}
				>
					<a href="/partenariats">Partenariats</a>
				</li>
			</ul>
		</div>
		{#if navOpen}
			<div class="nav-overlay" role="presentation" onclick={toggleNav}></div>
		{/if}
	</nav>
	<div class="header-right">
		{#if user}
			<span>Bienvenue, {user.username}!</span>
			<a href="/logout" class="login-btn" data-sveltekit-reload
				>Se déconnecter</a
			>
		{:else}
			<a href="/login" class="login-btn" data-sveltekit-reload
				>Se connecter</a
			>
		{/if}
	</div>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #1a2233; /* Modern dark blue */
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
		padding: 0 2rem;
		min-height: 64px;
	}

	.header-left {
		display: flex;
		align-items: center;
	}

	.logo-bde {
		height: 40px;
		width: 40px;
		margin-right: 0.75rem;
	}

	.site-title {
		font-size: 1.3rem;
		font-weight: bold;
		color: #f7c873; /* Soft gold accent */
		letter-spacing: 0.02em;
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
		color: #f7c873;
		font-weight: bold;
		border-bottom: 2px solid #f7c873;
	}

	header a {
		color: #e3eafc; /* Soft light blue */
		text-decoration: none;
		font-size: 1rem;
		padding: 0.5rem 0;
		transition: color 0.2s;
	}

	header a:hover {
		color: #f7c873;
	}

	.header-right {
		display: flex;
		align-items: center;
	}

	.login-btn {
		background: #f7c873;
		color: #1a2233;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1.2rem;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.2s, color 0.2s;
		box-shadow: 0 2px 8px rgba(247, 200, 115, 0.08);
	}

	.login-btn:hover {
		background: #e3eafc;
		color: #1a2233;
	}

	/* Collapsible menu for mobile */


	@media (max-width: 768px) {
		.header-nav {
			position: relative;
		}
		.header-left {
			display: flex;
			align-items: center;
		}
		.mobile-menu-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			background: #2d3652;
			border: 2px solid #f7c873;
			border-radius: 50%;
			width: 48px;
			height: 48px;
			margin-right: 0.5rem;
			font-size: 2rem;
			color: #f7c873;
			box-shadow: 0 2px 8px rgba(26, 34, 51, 0.12);
			transition: background 0.2s, border 0.2s, color 0.2s;
		}
		.mobile-menu-btn:active, .mobile-menu-btn:focus {
			background: #f7c873;
			border-color: #2d3652;
			color: #1a2233;
			outline: none;
		}
		.logo-bde {
			height: 64px;
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
			background: #232946;
			box-shadow: 2px 0 12px rgba(0,0,0,0.12);
			transform: translateX(-100%);
			transition: transform 0.3s cubic-bezier(.4,0,.2,1);
			z-index: 200;
			display: flex;
			flex-direction: column;
			padding-top: 64px;
		}
		.nav-drawer.open {
			transform: translateX(0);
		}
		.nav-drawer ul {
			flex-direction: column;
			gap: 1.2rem;
			list-style: none;
			margin: 0;
			padding: 0 1.5rem;
		}
		.nav-drawer li {
			padding: 0.5rem 0;
		}
		.nav-overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: rgba(0,0,0,0.25);
			z-index: 150;
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
