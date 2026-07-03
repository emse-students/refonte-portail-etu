<script lang="ts">
	import EntityDetail from "$lib/components/EntityDetail.svelte";

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.list.name} - Listes EMSE</title>
	<meta name="description" content={`Presentation de la liste ${data.list.name}.`} />
</svelte:head>

<EntityDetail entity={data.list} backHref="/lists" backLabel="Toutes les listes" />
