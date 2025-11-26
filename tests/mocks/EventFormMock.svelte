<script lang="ts">
	let { onClose, onSuccess } = $props();
</script>

<div data-testid="event-form-mock">
	Event Form Mock
	<button onclick={onClose}>Close</button>
	<button onclick={onSuccess}>Success</button>
</div>
