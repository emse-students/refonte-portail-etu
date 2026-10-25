<script lang="ts">
	import { m } from "#lib/paraglide/messages";
	import { page } from "$app/state";
	import Seo from "#lib/components/Seo.svelte";
	import { breadcrumbNode } from "#lib/seo";
	import { SITE_NAME } from "#lib/site";
</script>

<!-- French-only on purpose, like /mentions-legales: only the chrome goes through Paraglide. -->
<Seo
	meta={{
		section: m.nav_privacy(),
		description: m.privacy_meta_description(),
		jsonLd: [
			breadcrumbNode(page.url.origin, [
				{ name: SITE_NAME, path: "/" },
				{ name: m.nav_privacy(), path: "/confidentialite" },
			]),
		],
	}}
/>

<article lang="fr" class="prose dark:prose-invert max-w-3xl mx-auto px-6 py-12 w-full box-border">
	<h1 class="text-3xl md:text-4xl font-heading mb-8">Politique de confidentialité</h1>

	<h2>Qui est responsable</h2>
	<p>
		L'Association Rootz - EMSE (Maison des Élèves de l'École des Mines, 20 Boulevard Alexandre de
		Fraissinette, 42100 Saint-Étienne), éditrice du site. Contact :
		<a href="mailto:bureau@rootz-emse.fr">bureau@rootz-emse.fr</a>. Voir les
		<a href="/mentions-legales">mentions légales</a>.
	</p>

	<h2>Quelles données sont affichées</h2>
	<ul>
		<li>
			<strong>Pour les membres d'une association ou d'une liste</strong> : prénom, nom, promotion, rôle
			(par exemple président, trésorier, membre) et photo de profil lorsqu'elle existe.
		</li>
		<li>
			<strong>La « Carte de la Vie Asso »</strong> : une affiche des associations avec les photos,
			noms et rôles des présidents et des bureaux, et un annuaire des membres. C'est un
			<em>instantané</em> composé dans Canari puis republié périodiquement : il ne suit pas les changements
			de composition d'une association tant que la carte n'est pas republiée.
		</li>
		<li>
			<strong>Pour les associations</strong> : nom, logo, description et adresse de contact de l'association.
		</li>
	</ul>
	<p>
		Le site ne demande aucune donnée aux visiteurs, ne dépose aucun cookie de suivi et n'utilise
		aucun outil de mesure d'audience. Les polices de caractères sont servies par le site lui-même,
		sans appel à un service tiers. Seul un cookie de préférence de langue peut être enregistré.
	</p>

	<h2>D'où viennent les données</h2>
	<p>
		Les données de membres proviennent de l'application <strong>Canari</strong> (API publique en
		lecture seule), dans laquelle les associations gèrent leurs équipes. Les photos de profil
		proviennent de <strong>MiGallery</strong>. Ce site ne contient aucune base de données : il n'en
		est qu'un affichage.
	</p>

	<h2>Pourquoi, et sur quelle base légale</h2>
	<p>
		La finalité est de présenter publiquement les équipes des associations étudiantes de l'école et
		de permettre de les identifier et de les contacter. La base légale est l'<strong
			>intérêt légitime</strong
		>
		des associations à présenter leurs équipes (art. 6.1.f du RGPD). Chaque personne concernée dispose
		d'un <strong>droit d'opposition</strong> (art. 21 du RGPD), honoré sur simple demande : voir ci-dessous.
	</p>

	<h2>Qui voit ces données</h2>
	<p>
		Tout visiteur du site, sans compte. Les pages qui affichent des noms de personnes sont marquées
		<code>noindex</code> et sont absentes du plan du site : elles ne sont pas destinées à être retrouvées
		par une recherche sur un nom dans un moteur de recherche. Les intervenants techniques sont Canari
		et MiGallery (sources des données) et le serveur de l'école qui héberge le site.
	</p>

	<h2>Durée de conservation</h2>
	<ul>
		<li>
			<strong>Pages d'associations et de listes</strong> : le site ne conserve rien, il affiche l'état
			courant de Canari. Un membre retiré dans Canari disparaît du site ; une photo peut rester en mémoire
			tampon du serveur jusqu'à une heure.
		</li>
		<li>
			<strong>Carte de la Vie Asso</strong> : l'instantané est conservé jusqu'à la prochaine republication
			de la carte, qui le remplace entièrement. Il est conservé tel quel parce que c'est une affiche composée
			à la main, dont les cases ne sont pas recalculées à chaque visite. Une demande de retrait n'attend
			pas cette republication (voir ci-dessous).
		</li>
	</ul>

	<h2>Vos droits, et comment demander un retrait</h2>
	<p>
		Vous pouvez demander l'accès à vos données, leur rectification, leur effacement, la limitation
		de leur traitement, et vous <strong>opposer</strong> à leur affichage.
	</p>
	<p>
		<strong>Pour demander le retrait de votre nom ou de votre photo du site</strong>, écrivez à
		<a href="mailto:bureau@rootz-emse.fr">bureau@rootz-emse.fr</a> en indiquant votre nom et la page
		concernée. La demande est traitée <strong>sous 30 jours</strong> au plus, et le retrait du site est
		effectif dans ce délai, y compris sur la Carte de la Vie Asso.
	</p>

	<h2>Réclamation</h2>
	<p>
		Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL :
		<a href="https://www.cnil.fr/fr/plaintes" rel="noopener noreferrer">cnil.fr/fr/plaintes</a>.
	</p>
</article>
