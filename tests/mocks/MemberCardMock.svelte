<script lang="ts">
	export let member;
	export const isBureau = false;
	export let editMode = false;
	export let onRemove = (_memberId: any) => {};
	export let onEditMember = (_member: any) => {};
</script>

<div data-testid="member-card">
	<span>{member.user.first_name} {member.user.last_name}</span>
	<span>{member.role_name}</span>
	{#if editMode}
		<button onclick={() => onEditMember(member)}>Edit Member</button>
		<button onclick={() => onRemove(member.id)}>Remove</button>
	{/if}
</div>
