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
		section: data.list.name,
		description: m.list_meta_description({ name: data.list.name }),
		type: "article",
		image: logoUrl(data.list),
		imageAlt: data.list.name,
		jsonLd: [
			organizationNode({
				origin: page.url.origin,
				path: page.url.pathname,
				name: data.list.name,
				description: data.list.description,
				logo: logoUrl(data.list),
				email: data.list.contactEmail,
			}),
			breadcrumbNode(page.url.origin, [
				{ name: SITE_NAME, path: "/" },
				{ name: m.nav_lists(), path: "/lists" },
				{ name: data.list.name, path: page.url.pathname },
			]),
		],
	}}
/>

<EntityDetail entity={data.list} backHref="/lists" backLabel={m.detail_back_lists()} />
