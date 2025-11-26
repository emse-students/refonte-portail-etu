<script lang="ts">
	import Modal from "../../src/lib/components/Modal.svelte";
	let { open = $bindable(false), title } = $props();
</script>

<Modal bind:open {title}>
	<p>Modal Content</p>
</Modal>
