<script lang="ts">
	import { page } from "$app/state";
	import logo from "$lib/images/logo_bde.png";

	// Load the associations and lists from the api

	let data = $props();
	let user = data.user;

</script>

<header>
	<div class="header-left">
		<a href="/">
			<img src={logo} alt="Logo BDE EMSE" class="logo-bde" />
			<span class="site-title">Portail des Étudiants</span>
		</a>
	</div>
	<nav class="header-nav">
		<ul>
			<li aria-current={page.url.pathname === "/" ? "page" : undefined}>
				<a href="/">Accueil</a>
			</li>

			// Associations is a dropdown with the list of associations
			<li
				aria-current={page.url.pathname.startsWith("/associations")
					? "page"
					: undefined}
			>
				<button aria-haspopup="true" aria-expanded="false">
					Associations
				</button>
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
	</nav>
	<div class="header-right">
		{#if user}
			<span>Bienvenue, {user.username}!</span>
			<a href="/logout" class="login-btn" data-sveltekit-reload>Se déconnecter</a>
		{:else}
			<a href="/login" class="login-btn" data-sveltekit-reload>Se connecter</a>
		{/if}
	</div>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
		color: #1a237e;
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
		color: #1976d2;
		font-weight: bold;
		border-bottom: 2px solid #1976d2;
	}

	header a {
		color: #333;
		text-decoration: none;
		font-size: 1rem;
		padding: 0.5rem 0;
		transition: color 0.2s;
	}

	header a:hover {
		color: #1976d2;
	}

	.header-right {
		display: flex;
		align-items: center;
	}

	.login-btn {
		background: #1976d2;
		color: #fff;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1.2rem;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.2s;
	}

	.login-btn:hover {
		background: #1565c0;
	}
</style>
