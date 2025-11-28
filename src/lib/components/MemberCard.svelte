<script lang="ts">
	import type { Member } from "$lib/databasetypes";

	let {
		member,
		isBureau = false,
		editMode = false,
		onRemove = (_id: number) => {},
		onEditRole = (_member: Member) => {},
	}: {
		member: Member;
		isBureau?: boolean;
		editMode?: boolean;
		onRemove?: (id: number) => void;
		onEditRole?: (member: Member) => void;
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

	function handleEditRole() {
		onEditRole(member);
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
				<span class="member-role">{member.role.name}</span>
				{#if member.user.promo}
					<span class="member-promo">{member.user.promo}</span>
				{/if}
			</div>
		</div>
	</div>

	{#if editMode}
		<div class="edit-controls">
			<button class="edit-btn" onclick={handleEditRole}>Modifier rôle</button>
			<button class="remove-btn" onclick={handleRemove}>Retirer</button>
		</div>
	{/if}
</div>

<style>
	.member-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.25rem;
		transition: all 0.2s ease;
	}

	.bureau-card {
		background: white;
		border: 2px solid #7c3aed;
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
	}

	.member-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
		border-color: #c4b5fd;
	}

	.bureau-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 16px rgba(124, 58, 237, 0.25);
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
		border: 2px solid #e5e7eb;
		background: #f9fafb;
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
		border-color: #7c3aed;
	}

	.avatar-placeholder {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
		border: 2px solid #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.1rem;
		color: #6b7280;
		position: absolute;
		top: 0;
		left: 0;
	}

	.bureau-placeholder {
		background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
		border-color: #7c3aed;
		color: #7c3aed;
	}

	.member-info {
		flex: 1;
		min-width: 0;
	}

	.member-name {
		font-size: 1.05rem;
		font-weight: 600;
		color: #1a202c;
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
		color: #7c3aed;
		font-weight: 500;
		word-wrap: break-word;
		overflow-wrap: break-word;
		line-height: 1.3;
	}

	.member-promo {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
		padding: 0.15rem 0.5rem;
		border: 1.5px solid #d1d5db;
		border-radius: 6px;
		background: #f9fafb;
		white-space: nowrap;
	}

	.bureau-card .member-promo {
		border-color: #c4b5fd;
		background: #f5f3ff;
		color: #7c3aed;
	}

	.edit-controls {
		margin-top: 1rem;
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		border-top: 1px solid #f3f4f6;
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
		background: #edf2f7;
		color: #2d3748;
	}

	.remove-btn {
		background: #fee2e2;
		color: #c53030;
	}

	.edit-btn:hover {
		background: #e2e8f0;
	}

	.remove-btn:hover {
		background: #fecaca;
	}

	:global([data-theme="dark"]) .member-card {
		background: var(--bg-secondary, #1f2937);
		border-color: #374151;
	}

	:global([data-theme="dark"]) .bureau-card {
		background: var(--bg-secondary, #1f2937);
		border-color: var(--accent-primary, #7c3aed);
	}

	:global([data-theme="dark"]) .member-name {
		color: var(--text-primary, #f7fafc);
	}

	:global([data-theme="dark"]) .member-role {
		color: var(--accent-primary, #a78bfa);
	}

	:global([data-theme="dark"]) .member-promo {
		background: #2d3748;
		border-color: #4a5568;
		color: #cbd5e0;
	}

	:global([data-theme="dark"]) .bureau-card .member-promo {
		background: rgba(124, 58, 237, 0.1);
		border-color: var(--accent-primary, #7c3aed);
		color: var(--accent-primary, #a78bfa);
	}

	:global([data-theme="dark"]) .edit-btn {
		background: #2d3748;
		color: #cbd5e0;
	}

	:global([data-theme="dark"]) .edit-btn:hover {
		background: #4a5568;
	}

	:global([data-theme="dark"]) .remove-btn {
		background: rgba(220, 38, 38, 0.2);
		color: #fca5a5;
	}

	:global([data-theme="dark"]) .remove-btn:hover {
		background: rgba(220, 38, 38, 0.3);
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
	}
</style>
