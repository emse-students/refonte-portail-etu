/**
 * Shapes returned by the Canari public read-only API (`/api/public/*`).
 * These mirror the safe projection exposed by the social-service PublicController;
 * no sensitive field (vault key, notes, Stripe) is ever part of the payload.
 */

/** An association or a promo list as served by the public API. */
export interface CanariAssociation {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	bioMarkdown: string | null;
	logoUrl: string | null;
	/** Media-service UUID, served publicly at `${PUBLIC_CANARI_URL}/api/media/public/:id`. */
	logoMediaId: string | null;
	/** Hex color for theming (e.g. "#e09f3e"); null falls back to a generated color. */
	color: string | null;
	type: "association" | "list";
	/** Lists only: the promotion year (e.g. 2027). Null for associations. */
	promo: number | null;
	/** Lists only: id of the owning association (e.g. the BDE). Null otherwise. */
	parentAssociationId: string | null;
	/** Lists only: display name of the parent association, when resolved by the API. */
	parentName?: string | null;
	/** Lists only: optional second theme name (some lists run two themes). */
	name2?: string | null;
	/** Lists only: optional second theme logo (media-service UUID). */
	logoMediaId2?: string | null;
	archived: boolean;
	isBDE: boolean;
	contactEmail: string | null;
	memberCount: number;
}

/** A public member row, joined with the users mirror for display name and promo. */
export interface CanariMember {
	id: string;
	userId: string;
	role: string;
	/** Coarse flag: true when the member holds any admin permission. */
	isAdmin: boolean;
	displayName: string | null;
	firstName: string | null;
	lastName: string | null;
	promo: number | null;
	createdAt: string;
}

/** An association/list detail response: the entity plus its public members. */
export interface CanariAssociationDetail extends CanariAssociation {
	members: CanariMember[];
}

/**
 * The published "Carte de la Vie Asso" is a RESOLVED POSTER - not a layout, not an image: Canari
 * computes every box and every font size the printed poster draws, and this showcase reproduces them
 * verbatim. Anything the showcase decided for itself would be an approximation of a hand-composed
 * print, so it decides nothing.
 *
 * Two consequences worth knowing before touching `CarteVieAsso.svelte`:
 *
 * 1. **Every number below is in POSTER pixels**, against {@link PublishedCarte.stage} - not
 *    fractions, not CSS pixels. The renderer draws a `stage.w x stage.h` box and scales it once, so
 *    the numbers are used exactly as they arrive.
 * 2. **Association content is joined live; people are a snapshot.** A unit carries `assoId` only, so
 *    a rename or a new logo needs no republish. Which member appears in which slot is an authoring
 *    decision in Canari, so names and roles travel frozen - a roster change needs a republish.
 */

/** The poster frame every coordinate is expressed against (poster px). */
export interface PublishedCarteStage {
	w: number;
	h: number;
}

/** The poster's palette, resolved by Canari so a restyle there needs no deploy here. */
export interface PublishedCarteStyle {
	/** Page background, painted under the optional background image. */
	pageBg: string;
	/** Scrim drawn over the background image. */
	scrimColor: string;
	/** Member-card background + caption color. */
	cardBg: string;
	cardTextColor: string;
	/** Directory panel background + its primary / secondary text colors. */
	directoryBg: string;
	directoryTextColor: string;
	directoryMutedColor: string;
}

/** A positioned run of text: the poster title, or one of the author's free-text labels. */
export interface PublishedCarteText {
	/** Box left / top edge, in poster px. */
	x: number;
	y: number;
	/** Box width, in poster px; the text wraps inside it. */
	w: number;
	/** Stacking order; higher renders on top. */
	z: number;
	/** Font size, in poster px. */
	size: number;
	/** CSS font weight. */
	weight: number;
	content: string;
	color: string;
	align: "left" | "center" | "right";
}

/** A member card (president or bureau) drawn on a unit: square photo + name + optional role. */
export interface PublishedCarteCard {
	/** Avatar join key; the photo comes from this showcase's own same-origin proxy. */
	userId: string;
	name: string;
	/** Role line under the name, or '' when the member has none. */
	role: string;
	/** Initials shown when the photo does not load. Resolved by Canari so both sides agree. */
	initials: string;
	/** Card box in poster px, relative to the unit's top-left (before the unit scale). */
	x: number;
	y: number;
	w: number;
	nameSize: number;
	roleSize: number;
}

/** One association unit: the blob, its logo, its name band and the member cards around it. */
export interface PublishedCarteUnit {
	/** Association id; join key into {@link CanariAssociation}. */
	assoId: string;
	/** Unit top-left on the stage, in poster px. */
	x: number;
	y: number;
	/** Unit box at scale 1, in poster px. Scaled by `scale`, this is the link's hit area. */
	w: number;
	h: number;
	/** Author's unit scale; everything inside is at scale 1, so the box scales as one. */
	scale: number;
	z: number;
	/** Author's brand-color override, or null to use the association's live color. */
	color: string | null;
	/** Color the poster resolved, used when the association carries none of its own. */
	colorFallback: string;
	/** The colored silhouette, unit-relative poster px. */
	blob: { x: number; y: number; size: number; radius: string };
	/** The hero logo frame (may overflow the blob), unit-relative poster px. */
	logo: {
		x: number;
		y: number;
		w: number;
		h: number;
		radius: string;
		initialsSize: number;
		initials: string;
	};
	/** The association-name band inside the blob, unit-relative poster px. */
	name: {
		x: number;
		y: number;
		w: number;
		size: number;
		/** Font size of the contact-email line; the address itself is joined live. */
		emailSize: number;
	};
	/** President + bureau cards, in render order (crown first, president in front). */
	cards: PublishedCarteCard[];
}

/** One association's line in the directory. */
export interface PublishedCarteDirectoryAsso {
	/** Join key for the displayed name and the color dot. */
	assoId: string;
	/** The roster as the poster prints it: "Name (Role) - Name - ...", alphabetical. */
	line: string;
}

/** A category section of the directory. */
export interface PublishedCarteDirectoryZone {
	label: string;
	assos: PublishedCarteDirectoryAsso[];
}

/** The poster's right-hand member directory ("annuaire"). */
export interface PublishedCarteDirectory {
	/** Panel box on the stage, in poster px. Border-box: `padX`/`padY` sit inside it. */
	x: number;
	y: number;
	w: number;
	h: number;
	radius: number;
	padX: number;
	padY: number;
	heading: string;
	headingSize: number;
	/**
	 * Base body font size in poster px. A starting point, not the answer: the panel is a fixed box,
	 * so the renderer shrinks from here until the whole roster fits - the same loop Canari's editor
	 * runs, over the same poster pixels, landing on the same size.
	 */
	fontSize: number;
	columns: number;
	columnGap: number;
	zones: PublishedCarteDirectoryZone[];
}

/**
 * The map Canari currently has live, as served by `GET /api/public/carte`. At most one exists at a
 * time (a database invariant on the Canari side, not a convention).
 *
 * Canari validates every field of this document before serving it - geometry is clamped, colors are
 * a closed grammar (hex / rgb / hsl), and a `border-radius` that is not purely `[0-9%./ ]` is
 * replaced by a circle rather than escaped, because these values land in `style` attributes here.
 */
export interface PublishedCarte {
	/**
	 * Publication schema version. **2** is the resolved poster described above. A stored v1 document
	 * (fractions of the frame, a `bubbles` array, no members, no directory) has no `units` and is not
	 * renderable here, so the map is omitted until the author republishes.
	 */
	version: number;
	/** Frame width / height. Render into a box of this ratio or the map skews. */
	aspectRatio: number;
	stage: PublishedCarteStage;
	/** Background image (data URL) and the legibility scrim above it, as a percentage. */
	background: { dataUrl: string | null; scrimOpacity: number };
	style: PublishedCarteStyle;
	/** The poster's own title band, or null when the project has no name. */
	title: PublishedCarteText | null;
	units: PublishedCarteUnit[];
	texts: PublishedCarteText[];
	/** The member directory, or null when the author hid it. */
	directory: PublishedCarteDirectory | null;
}
