/**
 * Featured links to the wider Canari ecosystem, highlighted on the home page.
 * These are the "open face" pointers from the showcase to the real apps.
 */
export interface FeaturedLink {
	name: string;
	/** One-line tagline (French; will be routed through i18n). */
	tagline: string;
	url: string;
	/** Static asset path under /static for the logo, or null for a text badge. */
	icon: string | null;
	/** Accent color used for the card border/glow. */
	accent: string;
}

/** The four flagship destinations, in display order. */
export const featuredLinks: FeaturedLink[] = [
	{
		name: "Canari",
		tagline: "La messagerie chiffree et le reseau de la vie associative EMSE",
		url: "https://canari-emse.fr",
		icon: "/links/canari.png",
		accent: "#1b263b",
	},
	{
		name: "MiGallery",
		tagline: "Photos et videos des evenements etudiants",
		url: "https://gallery.mitv.fr",
		icon: "/links/migallery.png",
		accent: "#415a77",
	},
	{
		name: "Sky",
		tagline: "L'arbre genealogique des promotions de l'ecole",
		url: "https://sky.canari-emse.fr",
		icon: "/links/sky.png",
		accent: "#778da9",
	},
	{
		name: "Le Cercle",
		tagline: "Le bar associatif de la Maison des Eleves",
		url: "https://portail-etu.emse.fr/cercle",
		icon: "/links/cercle.png",
		accent: "#e09f3e",
	},
];
