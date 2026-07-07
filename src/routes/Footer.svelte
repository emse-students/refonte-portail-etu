<script lang="ts">
	import { SITE_NAME } from "$lib/site";

	const currentYear = new Date().getFullYear();
</script>

<footer
	class="mt-auto bg-mines-light-alt dark:bg-mines-navy-dark text-mines-navy dark:text-mines-platinum border-t border-black/5 dark:border-white/10 relative overflow-hidden"
>
	<!-- Subtle glass glow background effect -->
	<div
		class="absolute inset-0 bg-glass-gradient-dark dark:bg-glass-gradient pointer-events-none opacity-20"
	></div>

	<div class="max-w-6xl mx-auto px-6 py-16 flex flex-col gap-12 relative z-10">
		<div class="flex flex-col md:flex-row justify-between gap-12">
			<div class="max-w-lg">
				<p class="text-mines-navy/70 dark:text-mines-platinum/70 leading-relaxed text-lg m-0">
					La vitrine ouverte de
					<a
						href="https://canari-emse.fr"
						target="_blank"
						rel="noopener noreferrer"
						class="text-mines-gold font-semibold relative whitespace-nowrap transition-colors hover:text-black dark:hover:text-white group"
					>
						Canari
						<span
							class="absolute bottom-0 left-0 w-full h-0.5 bg-mines-gold scale-x-30 origin-left transition-transform duration-300 group-hover:scale-x-100 group-hover:bg-black dark:group-hover:bg-white"
						></span>
					</a>, le réseau de la vie associative de l'École des Mines de Saint-Étienne.
				</p>
			</div>

			<nav class="flex flex-wrap gap-16" aria-label="Liens du pied de page">
				<div class="flex flex-col gap-4">
					<span
						class="text-sm font-semibold uppercase tracking-wider text-mines-navy/90 dark:text-white/90 mb-1"
						>Navigation</span
					>
					<a
						href="/associations"
						class="text-mines-navy/70 dark:text-mines-platinum/70 hover:text-black dark:hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2 w-fit"
						>Associations</a
					>
					<a
						href="/lists"
						class="text-mines-navy/70 dark:text-mines-platinum/70 hover:text-black dark:hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2 w-fit"
						>Listes</a
					>
					<a
						href="/liens"
						class="text-mines-navy/70 dark:text-mines-platinum/70 hover:text-black dark:hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2 w-fit"
						>Liens</a
					>
				</div>
				<div class="flex flex-col gap-4">
					<span
						class="text-sm font-semibold uppercase tracking-wider text-mines-navy/90 dark:text-white/90 mb-1"
						>Écosystème</span
					>
					<a
						href="https://canari-emse.fr"
						target="_blank"
						rel="noopener noreferrer"
						class="text-mines-navy/70 dark:text-mines-platinum/70 hover:text-black dark:hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-2 w-fit group"
					>
						Canari
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="opacity-60 group-hover:opacity-100 transition-opacity"
							><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline
								points="15 3 21 3 21 9"
							></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg
						>
					</a>
				</div>
			</nav>
		</div>

		<div
			class="pt-8 border-t border-black/5 dark:border-white/10 flex justify-between items-center flex-wrap gap-4"
		>
			<p class="text-sm text-mines-navy/40 dark:text-white/40 m-0">
				&copy; {currentYear}
				{SITE_NAME}. Tous droits réservés.
			</p>
		</div>
	</div>
</footer>
