<script lang="ts">
	import { page } from "$app/state";
	import { SITE_NAME } from "$lib/site";
	import { canonicalUrl, defaultImage, fullTitle, jsonLdScript, type SeoMeta } from "$lib/seo";

	let { meta }: { meta: SeoMeta } = $props();

	// The REQUEST's own origin, never a constant: the site answers on its production hostname, on
	// localhost during development and on whatever a preview build is served from, and an absolute
	// URL built from the wrong one is a preview image no unfurler can fetch.
	const origin = $derived(page.url.origin);
	const canonical = $derived(canonicalUrl(origin, page.url.pathname));
	const image = $derived(meta.image || defaultImage(origin));
	const title = $derived(fullTitle(meta));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content={meta.type ?? "website"} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content="fr_FR" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	{#if meta.imageAlt}
		<meta property="og:image:alt" content={meta.imageAlt} />
	{/if}

	<!-- Without an explicit card type, X and several clients that copy its vocabulary render a bare
	     link rather than falling back to the Open Graph image. -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={image} />

	{#if meta.jsonLd && meta.jsonLd.length > 0}
		<!-- The only way for a component to emit a script element. The content is machine-authored
		     JSON whose `<` and `&` are unicode-escaped by `serializeJsonLd`, so an association name
		     typed by a human cannot close the element or introduce markup. -->
		<!-- The only way for a component to emit a script element. The content is machine-authored
		     JSON whose `<` and `&` are unicode-escaped by `serializeJsonLd`, so an association name
		     typed by a human cannot close the element or introduce markup. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript(meta.jsonLd)}
	{/if}
</svelte:head>
