<script lang="ts">
	import FeaturedLinks from "$lib/components/FeaturedLinks.svelte";
	import AssociationCard from "$lib/components/AssociationCard.svelte";
	import Button from "$lib/components/Button.svelte";
	import { reveal } from "$lib/actions/reveal";
	import { pageTitle } from "$lib/site";
	import { m } from "$lib/paraglide/messages";

	let { data } = $props();

	const preview = $derived(data.associations.slice(0, 8));
</script>

<svelte:head>
	<title>{pageTitle()}</title>
	<meta name="description" content={m.home_meta_description()} />
</svelte:head>

<section class="relative pt-24 pb-32 px-6 text-center overflow-hidden flex flex-col items-center">
	<!-- Subtle Hero Grid Background -->
	<div
		class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTM5LjUgMGwuNS41djM5bC0uNS41SDBMMSAzOS41di0zOUwwIC41WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIi8+Cjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTM5LjUgMGwuNS41djM5bC0uNS41SDBMMSAzOS41di0zOUwwIC41WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIi8+Cjwvc3ZnPg==')] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)] -z-10 opacity-30 dark:opacity-100"
		aria-hidden="true"
	></div>

	<!-- Glow -->
	<div
		class="absolute -top-1/4 left-1/2 w-[min(800px,100vw)] aspect-square -translate-x-1/2 bg-[radial-gradient(circle,rgba(224,159,62,0.15)_0%,rgba(65,90,119,0.1)_40%,transparent_70%)] blur-[40px] pointer-events-none -z-10"
		aria-hidden="true"
	></div>

	<div class="relative z-10 max-w-3xl mx-auto flex flex-col items-center" use:reveal>
		<span
			class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mines-gold/20 dark:bg-mines-gold/10 text-mines-gold-dark dark:text-mines-gold text-sm font-semibold tracking-wider uppercase mb-6 border border-mines-gold/30 dark:border-mines-gold/20 backdrop-blur-sm shadow-sm"
		>
			{m.home_eyebrow()}
		</span>

		<h1
			class="text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-mines-navy dark:text-mines-platinum mb-5 font-extrabold"
		>
			{m.home_title_lead()}
			<span class="bg-gradient-to-br from-mines-gold to-yellow-500 bg-clip-text text-transparent"
				>{m.home_title_highlight()}</span
			><br />
			{m.home_title_tail()}
		</h1>

		<p
			class="text-lg md:text-xl text-mines-navy/80 dark:text-mines-platinum/80 max-w-2xl mx-auto mb-10 leading-relaxed"
		>
			{m.home_lead()}
		</p>

		<div class="flex flex-wrap gap-4 justify-center">
			<Button href="/associations" variant="primary">{m.home_cta_explore()}</Button>
			<Button
				href="https://canari-emse.fr"
				variant="ghost"
				target="_blank"
				rel="noopener noreferrer"
			>
				{m.open_canari()}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="ml-2 opacity-70"
					><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline
						points="15 3 21 3 21 9"
					></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg
				>
			</Button>
		</div>
	</div>

	<div class="relative z-20 mt-12 md:-mb-16 w-full max-w-4xl px-4" use:reveal={{ delay: 200 }}>
		<dl
			class="flex flex-col md:flex-row flex-wrap justify-around items-center bg-white/60 dark:bg-glass-100 backdrop-blur-xl border border-white/60 dark:border-white/20 rounded-2xl p-8 shadow-xl gap-8 md:gap-4 relative overflow-hidden"
		>
			<div
				class="absolute inset-0 bg-glass-gradient pointer-events-none opacity-50 hidden dark:block"
			></div>
			<div
				class="absolute inset-0 bg-glass-gradient-dark pointer-events-none opacity-50 block dark:hidden"
			></div>
			<div class="flex flex-col items-center text-center flex-1 z-10">
				<dt class="text-4xl md:text-5xl font-extrabold text-mines-navy dark:text-white mb-2">
					{data.associations.length}
				</dt>
				<dd class="m-0 text-sm font-semibold text-mines-gold uppercase tracking-wider">
					{m.home_stat_associations()}
				</dd>
			</div>
			<div
				class="hidden md:block w-px h-16 bg-gradient-to-b from-transparent via-black/10 dark:via-white/20 to-transparent z-10"
			></div>
			<div class="flex flex-col items-center text-center flex-1 z-10">
				<dt class="text-4xl md:text-5xl font-extrabold text-mines-navy dark:text-white mb-2">
					{data.listCount}
				</dt>
				<dd class="m-0 text-sm font-semibold text-mines-gold uppercase tracking-wider">
					{m.home_stat_lists()}
				</dd>
			</div>
		</dl>
	</div>
</section>

<section class="max-w-6xl mx-auto px-6 py-20 w-full box-border" use:reveal>
	<div
		class="flex items-end justify-between gap-6 mb-10 pb-4 border-b border-black/10 dark:border-white/10 flex-wrap"
	>
		<div>
			<h2 class="text-3xl font-bold text-mines-navy dark:text-mines-platinum mb-2">
				{m.home_ecosystem_title()}
			</h2>
			<p class="m-0 text-mines-navy/70 dark:text-mines-platinum/70 text-lg">
				{m.home_ecosystem_subtitle()}
			</p>
		</div>
	</div>
	<FeaturedLinks />
</section>

{#if preview.length > 0}
	<section class="max-w-6xl mx-auto px-6 py-20 w-full box-border" use:reveal>
		<div
			class="flex items-end justify-between gap-6 mb-10 pb-4 border-b border-black/10 dark:border-white/10 flex-wrap"
		>
			<div>
				<h2 class="text-3xl font-bold text-mines-navy dark:text-mines-platinum mb-2">
					{m.home_associations_title()}
				</h2>
				<p class="m-0 text-mines-navy/70 dark:text-mines-platinum/70 text-lg">
					{m.home_associations_subtitle()}
				</p>
			</div>
			<a
				class="inline-flex items-center gap-1.5 text-mines-gold font-semibold transition-all hover:gap-2.5"
				href="/associations"
			>
				{m.home_see_all()}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg
				>
			</a>
		</div>

		<div class="flex-grid-4">
			{#each preview as association (association.id)}
				<AssociationCard {association} />
			{/each}
		</div>
	</section>
{/if}
