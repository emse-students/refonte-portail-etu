<script lang="ts">
	export let member;
	export const isBureau = false;
	export let editMode = false;
	export let onRemove = (_memberId: any) => {};
	export let onEditRole = (_member: any) => {};
</script>

<div data-testid="member-card">
	<span>{member.user.first_name} {member.user.last_name}</span>
	<span>{member.role.name}</span>
	{#if editMode}
		<button onclick={() => onEditRole(member)}>Edit Role</button>
		<button onclick={() => onRemove(member.id)}>Remove</button>
	{/if}
</div>
