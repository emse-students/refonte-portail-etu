<footer>
	<div class="inner">
		<p class="tag">
			La vitrine ouverte de <a
				href="https://canari-emse.fr"
				target="_blank"
				rel="noopener noreferrer">Canari</a
			>, le reseau de la vie associative de l'Ecole des Mines de Saint-Etienne.
		</p>
		<nav class="links" aria-label="Liens du pied de page">
			<a href="/associations">Associations</a>
			<a href="/lists">Listes</a>
			<a href="/liens">Liens</a>
			<a href="https://canari-emse.fr" target="_blank" rel="noopener noreferrer">Canari</a>
		</nav>
		<p class="fine">Portail etudiant EMSE</p>
	</div>
</footer>

<style>
	footer {
		margin-top: auto;
		background: var(--color-primary-dark);
		color: var(--color-text-on-primary);
	}

	.inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
	}

	.tag {
		max-width: 46rem;
		margin: 0;
		color: rgba(224, 225, 221, 0.85);
		line-height: 1.6;
	}

	.tag a {
		color: var(--color-secondary);
		font-weight: 600;
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem 1.5rem;
	}

	.links a {
		color: rgba(224, 225, 221, 0.8);
		font-size: 0.95rem;
		transition: color 0.2s ease;
	}

	.links a:hover {
		color: #fff;
	}

	.fine {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(224, 225, 221, 0.55);
	}
</style>
