<script lang="ts">
	import { featuredLinks } from "$lib/links";
	import { initials } from "$lib/media";
</script>

<div class="flex-grid-3">
	{#each featuredLinks as link (link.name)}
		<a
			class="relative flex items-center gap-4 p-5 bg-white/40 dark:bg-glass-100 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-xl shadow-lg hover:-translate-y-1 hover:shadow-xl hover:border-[var(--accent)] dark:hover:border-[var(--accent)] transition-all duration-300 overflow-hidden group"
			href={link.url}
			target="_blank"
			rel="noopener noreferrer"
			style="--accent:{link.accent}"
		>
			<div class="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]"></div>

			<div
				class="relative flex-none w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold overflow-hidden shadow-sm"
				style={link.icon ? "" : `background:${link.accent}`}
			>
				{#if link.icon}
					<img
						src={link.icon}
						alt=""
						loading="lazy"
						class="absolute inset-0 w-full h-full object-contain p-1"
						onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
					/>
				{:else}
					<span>{initials(link.name)}</span>
				{/if}
			</div>

			<div class="min-w-0 flex-1">
				<h3 class="m-0 mb-1 text-lg font-semibold text-mines-navy dark:text-mines-platinum">
					{link.name}
				</h3>
				<p class="m-0 text-sm text-mines-navy/70 dark:text-mines-platinum/70 leading-snug">
					{link.tagline}
				</p>
			</div>

			<span
				class="ml-auto text-[var(--accent)] text-xl transition-transform duration-200 group-hover:translate-x-1"
				aria-hidden="true">&rarr;</span
			>
		</a>
	{/each}
</div>
