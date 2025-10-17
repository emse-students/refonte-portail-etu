<script lang="ts">
	import type { Association } from "$lib/databasetypes.d.ts";

	let { association, onclose }: { association: Association, onclose: () => void } = $props();

	const contact = association.members.find(e => e.role.name === "Secrétaire")?.user?.email ?? "Aucun";

</script>

<div class="details-panel">
	<button class="details-back" onclick={onclose}
		>← Retour</button
	>

	<div
		class="details-icon"
		style="background-color: {association.color};"
	>
		{association.icon}
	</div>
	<h2 class="details-title">{association.name}</h2>
	<p class="details-description">{association.description}</p>

	<div class="details-stats">
		<div class="stat-card">
			<div class="stat-label">🕐 Créée en</div>
			<div class="stat-value">{association.established}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">✉️ Contact</div>
			<div class="stat-value">{contact}</div>
		</div>
	</div>

	<div class="section">
		<h3 class="section-title">
			👥 Membres ({association.members.length})
		</h3>
		<div class="member-list">
			{#each association.members as member}
				<div class="member-item">{member}</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.details-panel {
		width: 24rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-left: 1px solid rgba(255, 255, 255, 0.3);
		padding: 2rem;
		overflow-y: auto;
		position: fixed;
		right: 0;
		top: 5rem;
		height: calc(100vh - 5rem);
		z-index: 950;
		animation: slideIn 0.3s ease;
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
	}
	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	.details-back {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		margin-bottom: 1.5rem;
		font-size: 1rem;
	}
	.details-back:hover {
		background: rgba(107, 114, 128, 0.1);
		color: #374151;
	}
	.details-icon {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		color: white;
		margin-bottom: 1rem;
	}
	.details-title {
		font-size: 1.5rem;
		font-weight: bold;
		color: #1a202c;
		margin-bottom: 0.5rem;
	}
	.details-description {
		color: #4a5568;
		line-height: 1.6;
		margin-bottom: 2rem;
		font-size: 1rem;
	}
	.details-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.stat-card {
		background: rgba(255, 255, 255, 0.6);
		padding: 1rem;
		border-radius: 0.75rem;
	}
	.stat-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.5rem;
	}
	.stat-value {
		font-weight: 600;
		color: #1a202c;
	}
	.section {
		margin-bottom: 2rem;
	}
	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a202c;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid rgba(102, 126, 234, 0.2);
	}
	.member-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.member-item {
		background: rgba(255, 255, 255, 0.6);
		padding: 0.75rem;
		border-radius: 0.5rem;
		color: #4a5568;
		transition: all 0.2s ease;
	}
	.member-item:hover {
		background: rgba(255, 255, 255, 0.8);
		transform: translateX(0.25rem);
	}
	@media (max-width: 1024px) {
		.details-panel {
			width: 100%;
			max-height: none;
			position: fixed;
			top: 0;
			left: 0;
			z-index: 1100;
			height: 100vh;
		}
	}
</style>
