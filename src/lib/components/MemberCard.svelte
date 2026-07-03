<script lang="ts">
	import type { CanariMember } from "$lib/types";
	import { initials, generateColor } from "$lib/media";

	let { member, bureau = false }: { member: CanariMember; bureau?: boolean } = $props();

	const name = $derived(
		member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ") || "Membre"
	);
</script>

<div class="member" class:bureau>
	<div class="avatar" style="background:{generateColor(name)}">{initials(name)}</div>
	<div class="info">
		<div class="name">{name}</div>
		<div class="meta">
			<span class="role">{member.role}</span>
			{#if member.promo}
				<span class="promo">{member.promo}</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.member {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #fff;
		border: 1px solid var(--color-bg-2);
		border-radius: var(--radius-md);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.member:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.member.bureau {
		border-color: var(--color-secondary);
		background: linear-gradient(180deg, #fffdf6, #fff);
	}

	.avatar {
		flex: none;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-weight: 700;
		font-size: 0.9rem;
		user-select: none;
	}

	.info {
		min-width: 0;
	}

	.name {
		font-weight: 600;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82rem;
		color: var(--color-text-light);
	}

	.role {
		color: var(--color-primary-light);
		font-weight: 500;
	}

	.promo::before {
		content: "· ";
	}
</style>
