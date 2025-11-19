<script lang="ts">
	import type { Member } from "$lib/databasetypes";

	let { member, isBureau = false }: { member: Member; isBureau?: boolean } = $props();

	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleImageLoad() {
		imageLoaded = true;
	}

	function handleImageError() {
		imageError = true;
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
				{member.user.first_name} {member.user.last_name}
			</div>
			<div class="member-role">{member.role.name}</div>
		</div>
	</div>
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
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.member-avatar {
		width: 48px;
		height: 48px;
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
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
		border: 2px solid #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1rem;
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
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.member-role {
		font-size: 0.9rem;
		color: #7c3aed;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 768px) {
		.member-card,
		.bureau-card {
			padding: 1rem;
		}

		.avatar-container {
			width: 40px;
			height: 40px;
		}

		.member-avatar,
		.avatar-placeholder {
			width: 40px;
			height: 40px;
			font-size: 0.875rem;
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
	}
</style>
