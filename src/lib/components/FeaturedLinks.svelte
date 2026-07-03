<script lang="ts">
	import { featuredLinks } from "$lib/links";
	import { initials } from "$lib/media";
</script>

<div class="links">
	{#each featuredLinks as link (link.name)}
		<a
			class="link"
			href={link.url}
			target="_blank"
			rel="noopener noreferrer"
			style="--accent:{link.accent}"
		>
			<div class="badge" style="background:{link.accent}">
				{#if link.icon}
					<img
						src={link.icon}
						alt=""
						loading="lazy"
						onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
					/>
				{/if}
				<span>{initials(link.name)}</span>
			</div>
			<div class="text">
				<h3>{link.name}</h3>
				<p>{link.tagline}</p>
			</div>
			<span class="arrow" aria-hidden="true">&rarr;</span>
		</a>
	{/each}
</div>

<style>
	.links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
	}

	.link {
		position: relative;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background: #fff;
		border: 1px solid var(--color-bg-2);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
	}

	.link::before {
		content: "";
		position: absolute;
		inset: 0 auto 0 0;
		width: 4px;
		background: var(--accent);
	}

	.link:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-md);
		border-color: var(--accent);
	}

	.badge {
		position: relative;
		flex: none;
		width: 52px;
		height: 52px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-weight: 700;
		overflow: hidden;
	}

	.badge img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.text {
		min-width: 0;
	}

	.text h3 {
		margin: 0 0 0.2rem;
		font-size: 1.1rem;
		color: var(--color-text);
	}

	.text p {
		margin: 0;
		font-size: 0.88rem;
		color: var(--color-text-light);
		line-height: 1.45;
	}

	.arrow {
		margin-left: auto;
		color: var(--accent);
		font-size: 1.2rem;
		transition: transform 0.2s ease;
	}

	.link:hover .arrow {
		transform: translateX(4px);
	}
</style>
