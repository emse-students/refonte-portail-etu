<footer>
	<p>&copy; {new Date().getFullYear()} - BDE de l'EMSE</p>
	<p>
		Site développé en 2025 par
		<a href="mailto:leon.muselli@etu.emse.fr">Léon Muselli</a> &amp; Mathieu Daussin
		- ICM 2024
	</p>
</footer>

<style>
	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 2rem 1.5rem;
		text-align: center;
		background: linear-gradient(135deg, #5b21b6 0%, #482c65 100%);
		box-shadow: 0 -2px 8px rgba(124, 58, 237, 0.1);
		margin-top: auto;
	}

	footer p {
		margin: 0.35rem 0;
		color: rgba(255, 255, 255, 0.75);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	footer a {
		color: #f0abfc;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	footer a:hover {
		color: #ffffff;
	}

	@media (min-width: 480px) {
		footer {
			padding: 2.5rem 2rem;
		}

		footer p {
			font-size: 0.95rem;
		}
	}
</style>
