/**
 * Featured links to the wider Canari ecosystem, highlighted on the home page.
 * These are the "open face" pointers from the showcase to the real apps.
 */
export interface FeaturedLink {
	name: string;
	/** Stable identifier used to resolve the localized tagline in the view. */
	id: "canari" | "migallery" | "sky" | "cercle";
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
		id: "canari",
		url: "https://canari-emse.fr",
		icon: "/links/canari.png",
		accent: "#1b263b",
	},
	{
		name: "MiGallery",
		id: "migallery",
		url: "https://gallery.mitv.fr",
		icon: "/links/migallery.png",
		accent: "#415a77",
	},
	{
		name: "Sky",
		id: "sky",
		url: "https://sky.mitv.fr",
		icon: "/links/sky.png",
		accent: "#778da9",
	},
	{
		name: "Le Cercle",
		id: "cercle",
		url: "https://portail-etu.emse.fr/cercle",
		icon: "/links/cercle.png",
		accent: "#e09f3e",
	},
];
