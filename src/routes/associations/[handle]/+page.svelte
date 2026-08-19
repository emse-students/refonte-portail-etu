<script lang="ts">
	import EntityDetail from "$lib/components/EntityDetail.svelte";
	import { SITE_NAME } from "$lib/site";
	import { m } from "$lib/paraglide/messages";
	import { page } from "$app/state";
	import Seo from "$lib/components/Seo.svelte";
	import { breadcrumbNode, organizationNode } from "$lib/seo";
	import { logoUrl } from "$lib/media";

	let { data } = $props();
</script>

<Seo
	meta={{
		section: data.association.name,
		description: m.association_meta_description({ name: data.association.name }),
		type: "article",
		image: logoUrl(data.association),
		imageAlt: data.association.name,
		jsonLd: [
			organizationNode({
				origin: page.url.origin,
				path: page.url.pathname,
				name: data.association.name,
				description: data.association.description,
				logo: logoUrl(data.association),
				email: data.association.contactEmail,
			}),
			breadcrumbNode(page.url.origin, [
				{ name: SITE_NAME, path: "/" },
				{ name: m.nav_associations(), path: "/associations" },
				{ name: data.association.name, path: page.url.pathname },
			]),
		],
	}}
/>

<EntityDetail
	entity={data.association}
	backHref="/associations"
	backLabel={m.detail_back_associations()}
/>
