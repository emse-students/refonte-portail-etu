<script lang="ts">
	import { m } from "$lib/paraglide/messages";
	import { page } from "$app/state";
	import Seo from "$lib/components/Seo.svelte";
	import { breadcrumbNode } from "$lib/seo";
	import { SITE_NAME } from "$lib/site";
</script>

<!--
	Legal text is French-only by design: it is the text of record under French law (LCEN, art. 6),
	written for a French-speaking readership, and a translation that drifts from it is a liability.
	Only the chrome (title, description, footer link) goes through Paraglide.
-->
<Seo
	meta={{
		section: m.nav_legal(),
		description: m.legal_meta_description(),
		jsonLd: [
			breadcrumbNode(page.url.origin, [
				{ name: SITE_NAME, path: "/" },
				{ name: m.nav_legal(), path: "/mentions-legales" },
			]),
		],
	}}
/>

<article lang="fr" class="prose dark:prose-invert max-w-3xl mx-auto px-6 py-12 w-full box-border">
	<h1 class="text-3xl md:text-4xl font-heading mb-8">Mentions légales</h1>

	<h2>Éditeur du site</h2>
	<p>
		Le Portail Étudiant ICM est édité par l'<strong>Association Rootz - EMSE</strong>, Maison des
		Élèves de l'École des Mines, 20 Boulevard Alexandre de Fraissinette, 42100 Saint-Étienne.
	</p>
	<p>Contact : <a href="mailto:bureau@rootz-emse.fr">bureau@rootz-emse.fr</a></p>

	<h2>Directeur de la publication</h2>
	<p>Le/la président(e) de l'association Rootz.</p>

	<h2>Hébergement</h2>
	<p>
		Le site est hébergé sur le serveur mutualisé de l'École des Mines de Saint-Étienne, administré
		avec la direction des systèmes d'information (DSI) de l'école.
	</p>

	<h2>Nature du site</h2>
	<p>
		Ce site est une vitrine en lecture seule de la vie associative de l'École des Mines de
		Saint-Étienne. Il ne comporte ni compte, ni formulaire, ni base de données : les associations,
		les listes et leurs membres sont gérés dans l'application Canari, et les photos dans MiGallery.
	</p>

	<h2>Données personnelles</h2>
	<p>
		Le traitement des données personnelles affichées sur ce site, et la façon d'en demander le
		retrait, sont décrits dans la <a href="/confidentialite">politique de confidentialité</a>.
	</p>

	<h2>Propriété intellectuelle</h2>
	<p>
		Les logos et noms des associations appartiennent à leurs associations respectives. Le code du
		site est publié sous la licence indiquée dans son dépôt public.
	</p>
</article>
