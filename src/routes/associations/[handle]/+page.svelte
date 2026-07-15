<script lang="ts">
	import EntityDetail from "$lib/components/EntityDetail.svelte";
	import { pageTitle } from "$lib/site";
	import { m } from "$lib/paraglide/messages";

	let { data } = $props();
</script>

<svelte:head>
	<title>{pageTitle(data.association.name)}</title>
	<meta
		name="description"
		content={m.association_meta_description({ name: data.association.name })}
	/>
</svelte:head>

<EntityDetail
	entity={data.association}
	backHref="/associations"
	backLabel={m.detail_back_associations()}
/>
