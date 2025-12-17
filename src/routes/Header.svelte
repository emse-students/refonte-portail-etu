<script lang="ts">
	import { asset, resolve } from "$app/paths";
	import { page } from "$app/state";
	import { signIn, signOut } from "@auth/sveltekit/client";
	import { onMount, tick } from "svelte";
	import Sun from "$lib/components/icons/Sun.svelte";
	import Moon from "$lib/components/icons/Moon.svelte";

	// Load the associations and lists from the api

	const data = $props();
	const user = data.user;

	// Animated underline indicator
	let navUl: HTMLUListElement;
	let underlineStyle = $state("");

	// Theme state
	let isDark = $state(false);

	function toggleTheme() {
		isDark = !isDark;
		if (typeof document !== "undefined") {
			if (isDark) {
				document.documentElement.setAttribute("data-theme", "dark");
				localStorage.setItem("theme", "dark");
			} else {
				document.documentElement.removeAttribute("data-theme");
				localStorage.setItem("theme", "light");
			}
		}
	}

	function updateUnderline() {
		if (typeof window === "undefined" || !navUl) return;

		const activeItem = navUl.querySelector('li[aria-current="page"]');
		if (activeItem) {
			const link = activeItem.querySelector("a");
			if (link) {
				const ulRect = navUl.getBoundingClientRect();
				const linkRect = link.getBoundingClientRect();
				const left = linkRect.left - ulRect.left;
				const width = linkRect.width;
				underlineStyle = `left: ${left}px; width: ${width}px; opacity: 1;`;
			}
		} else {
			underlineStyle = "opacity: 0;";
		}
	}

	onMount(() => {
		// Initialize theme state from DOM (handled by app.html script)
		isDark = document.documentElement.getAttribute("data-theme") === "dark";

		updateUnderline();
		// Update on window resize
		window.addEventListener("resize", updateUnderline);
		return () => window.removeEventListener("resize", updateUnderline);
	});

	$effect(() => {
		// Update when page changes (accessing pathname to make effect reactive)
		void page.url.pathname;
		tick().then(updateUnderline);
	});
</script>

<header>
	<div class="header-left">
		<a href="/">
			<img
				src={asset("/logo.png")}
				alt="Logo BDE EMSE"
				class="logo-bde"
				width="2000"
				height="2000"
			/>
			<span class="site-title">Portail des Étudiants</span>
		</a>
	</div>
	<nav class="header-nav">
		<ul bind:this={navUl}>
			<li aria-current={page.url.pathname === resolve("/") ? "page" : undefined}>
				<a href={resolve("/")}>Accueil</a>
			</li>
			<li
				aria-current={page.url.pathname.startsWith(resolve("/associations")) ? "page" : undefined}
			>
				<a href={resolve("/associations")}>Associations</a>
			</li>
			<li aria-current={page.url.pathname.startsWith(resolve("/lists")) ? "page" : undefined}>
				<a href={resolve("/lists")}>Listes</a>
			</li>
			<li
				aria-current={page.url.pathname.startsWith(resolve("/autres-sites")) ? "page" : undefined}
			>
				<a href={resolve("/autres-sites")}>Autres Sites</a>
			</li>
			<li
				aria-current={page.url.pathname.startsWith(resolve("/partenariats")) ? "page" : undefined}
			>
				<a href={resolve("/partenariats")}>Partenariats</a>
			</li>
			<div class="nav-underline" style={underlineStyle}></div>
		</ul>
	</nav>
	<div class="header-right">
		<button
			class="theme-toggle"
			onclick={toggleTheme}
			aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
		>
			{#if isDark}
				<!-- Sun icon -->
				<Sun width="20" height="20" class="icon" />
			{:else}
				<!-- Moon icon -->
				<Moon width="20" height="20" class="icon" />
			{/if}
		</button>
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
		background: linear-gradient(
			135deg,
			var(--color-primary) 0%,
			var(--color-primary-light) 50%,
			var(--color-primary) 100%
		);
		box-shadow: var(--shadow-md);
		padding: 0.75rem 2rem;
		min-height: 70px;
		z-index: 100;
		backdrop-filter: blur(10px);
		transition: box-shadow 0.3s ease;
	}

	header:hover {
		box-shadow: var(--shadow-lg);
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
		color: var(--color-secondary);
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
		background: var(--color-secondary);
		border-radius: 2px;
		transition:
			left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.3s ease;
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
		gap: 1rem;
	}

	.theme-toggle {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
		padding: 0;
	}

	.theme-toggle:hover {
		background: rgba(255, 255, 255, 0.25);
		transform: translateY(-1px);
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

	/* Mobile styles */
	@media (max-width: 768px) {
		header {
			padding: 0.75rem 1rem;
		}

		.header-nav {
			display: none;
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
	}
</style>
