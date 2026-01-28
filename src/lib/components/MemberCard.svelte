<script lang="ts">
	import type { Member } from "$lib/databasetypes";

	let {
		member,
		isBureau = false,
		editMode = false,
		hidden = false,
		onRemove = (_id: number) => {},
		onEditMember = (_member: Member) => {},
	}: {
		member: Member;
		isBureau?: boolean;
		editMode?: boolean;
		hidden?: boolean;
		onRemove?: (id: number) => void;
		onEditMember?: (member: Member) => void;
	} = $props();

	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleImageLoad() {
		imageLoaded = true;
	}

	function handleImageError() {
		imageError = true;
	}

	function handleRemove() {
		onRemove(member.id);
	}

	function handleEditMember() {
		onEditMember(member);
	}

	// Générer les initiales pour le placeholder
	const initials = $derived(
		`${member.user.first_name.charAt(0)}${member.user.last_name.charAt(0)}`.toUpperCase()
	);
</script>

<div class="member-card" class:bureau-card={isBureau}>
	<div class="member-header">
		<div class="avatar-container">
			{#if !imageLoaded && !imageError}
				<div class="avatar-placeholder" class:bureau-placeholder={isBureau}>
					{initials}
				</div>
			{/if}
			<img
				src="/api/users/login/{member.user.login}/avatar"
				alt="{member.user.first_name} {member.user.last_name}"
				class="member-avatar"
				class:loaded={imageLoaded}
				class:hidden={imageError}
				loading="lazy"
				onload={handleImageLoad}
				onerror={handleImageError}
			/>
			{#if imageError}
				<div class="avatar-placeholder" class:bureau-placeholder={isBureau}>
					{initials}
				</div>
			{/if}
		</div>
		<div class="member-info">
			<div class="member-name">
				{member.user.first_name}
				{member.user.last_name}
			</div>
			<div class="member-role-container">
				<span class="member-role">{member.role_name}</span>
				{#if member.user.promo}
					<span class="member-promo">{member.user.promo}</span>
				{/if}
				{#if hidden}
					<span class="member-hidden">Invisible</span>
				{/if}
			</div>
		</div>
	</div>

	{#if editMode}
		<div class="edit-controls">
			<button class="edit-btn" onclick={handleEditMember}>Modifier</button>
			<button class="remove-btn" onclick={handleRemove}>Retirer</button>
		</div>
	{/if}
</div>

<style>
	.member-card {
		background: var(--bg-secondary);
		border: 1px solid var(--color-bg-1);
		border-radius: 12px;
		padding: 1.25rem;
		transition: all 0.2s ease;
	}

	.bureau-card {
		background: var(--bg-secondary);
		border: 2px solid var(--color-primary);
		box-shadow: var(--shadow-md);
	}

	.member-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--color-primary-light);
	}

	.bureau-card:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-lg);
	}

	.member-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-direction: row-reverse;
		justify-content: space-between;
	}

	.avatar-container {
		position: relative;
		width: 56px;
		height: 56px;
		flex-shrink: 0;
	}

	.member-avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--color-bg-1);
		background: var(--color-bg-1);
		opacity: 0;
		transition: opacity 0.3s ease;
		position: absolute;
		top: 0;
		left: 0;
	}

	.member-avatar.loaded {
		opacity: 1;
	}

	.member-avatar.hidden {
		display: none;
	}

	.bureau-card .member-avatar {
		border-color: var(--color-primary);
	}

	.avatar-placeholder {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-bg-1) 0%, var(--color-bg-2) 100%);
		border: 2px solid var(--color-bg-1);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.1rem;
		color: var(--color-text-light);
		position: absolute;
		top: 0;
		left: 0;
	}

	.bureau-placeholder {
		background: linear-gradient(135deg, var(--color-bg-1) 0%, var(--color-bg-2) 100%);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.member-info {
		flex: 1;
		min-width: 0;
	}

	.member-name {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
		word-wrap: break-word;
		overflow-wrap: break-word;
		line-height: 1.3;
	}

	.member-role-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.member-role {
		font-size: 0.9rem;
		color: var(--color-primary);
		font-weight: 500;
		word-wrap: break-word;
		overflow-wrap: break-word;
		line-height: 1.3;
	}

	.member-promo {
		font-size: 0.75rem;
		color: var(--color-primary);
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border: 1px solid var(--color-primary-light);
		border-radius: 6px;
		background: transparent;
		white-space: nowrap;
	}

	.member-hidden {
		font-size: 0.75rem;
		color: var(--color-bg-2);
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 6px;
		background: transparent;
		white-space: nowrap;
	}

	.bureau-card .member-promo {
		border-color: var(--color-primary-light);
		background: var(--color-accent-light);
		color: var(--color-primary);
	}

	.edit-controls {
		margin-top: 1rem;
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		border-top: 1px solid var(--color-bg-1);
		padding-top: 0.75rem;
	}

	.edit-btn,
	.remove-btn {
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		font-size: 0.85rem;
		cursor: pointer;
		border: none;
		font-weight: 500;
		transition: all 0.2s;
	}

	.edit-btn {
		background: var(--color-bg-1);
		color: var(--color-text);
	}

	.remove-btn {
		background: var(--color-secondary);
		color: var(--color-primary-dark);
	}

	.edit-btn:hover {
		background: var(--color-bg-2);
	}

	.remove-btn:hover {
		filter: brightness(0.9);
	}

	@media (max-width: 768px) {
		.member-card,
		.bureau-card {
			padding: 1rem;
		}

		.avatar-container {
			width: 48px;
			height: 48px;
		}

		.member-avatar,
		.avatar-placeholder {
			width: 48px;
			height: 48px;
			font-size: 0.95rem;
		}

		.member-header {
			gap: 0.75rem;
		}

		.member-name {
			font-size: 0.95rem;
		}

		.member-role {
			font-size: 0.85rem;
		}

		.member-promo {
			font-size: 0.7rem;
			padding: 0.125rem 0.4rem;
		}

		.member-hidden {
			font-size: 0.7rem;
			padding: 0.125rem 0.4rem;
		}
	}
</style>
