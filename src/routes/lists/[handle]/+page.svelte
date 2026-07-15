<script lang="ts">
	import EntityDetail from "$lib/components/EntityDetail.svelte";
	import { pageTitle } from "$lib/site";
	import { m } from "$lib/paraglide/messages";

	let { data } = $props();
</script>

<svelte:head>
	<title>{pageTitle(data.list.name)}</title>
	<meta name="description" content={m.list_meta_description({ name: data.list.name })} />
</svelte:head>

<EntityDetail entity={data.list} backHref="/lists" backLabel={m.detail_back_lists()} />
