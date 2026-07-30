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
 * One association placed on the published "Carte de la Vie Asso".
 *
 * Placement only - deliberately no name, logo or brand color. `assoId` is the join key into
 * {@link CanariAssociation}, so a rename or a new logo in Canari reaches the live map with no
 * republish. Geometry is a fraction of the frame rather than pixels, so the map renders at any
 * width as long as the frame keeps {@link PublishedCarte.aspectRatio}.
 */
export interface PublishedCarteBubble {
	/** Association id; join key into the public association list. */
	assoId: string;
	/** Blob left edge, as a fraction of the frame width. */
	x: number;
	/** Blob top edge, as a fraction of the frame height. */
	y: number;
	/** Blob diameter, as a fraction of the frame WIDTH (the blob is square). */
	w: number;
	/** Stacking order; higher renders on top. */
	z: number;
	/** Author's brand-color override (hex), or null to use the association's live color. */
	color: string | null;
	/** Blob silhouette, as a CSS `border-radius` value already resolved by Canari. */
	radius: string;
	/** Logo frame, as a CSS `border-radius` value already resolved by Canari. */
	logoRadius: string;
}

/** A free-text label placed on the published map. */
export interface PublishedCarteText {
	/** Left edge, as a fraction of the frame width. */
	x: number;
	/** Top edge, as a fraction of the frame height. */
	y: number;
	/** Box width, as a fraction of the frame width. */
	w: number;
	/** Stacking order; higher renders on top. */
	z: number;
	/** Font size, as a fraction of the frame WIDTH. */
	size: number;
	content: string;
	/** Text color (hex). */
	color: string;
	bold: boolean;
	align: "left" | "center" | "right";
}

/**
 * The map Canari currently has live, as served by `GET /api/public/carte`. At most one exists at a
 * time (a database invariant on the Canari side, not a convention).
 *
 * Canari validates every field of this document before serving it - geometry is clamped, colors are
 * hex or null, and a `border-radius` that is not purely `[0-9%./ ]` is replaced by a circle rather
 * than escaped, because these values land in `style` attributes here.
 */
export interface PublishedCarte {
	/** Publication schema version; bumped only on a breaking change to this shape. */
	version: number;
	/** Frame width / height. Render into a box of this ratio or the map skews. */
	aspectRatio: number;
	/** Background image (data URL) and the legibility scrim above it, as a percentage. */
	background: { dataUrl: string | null; scrimOpacity: number };
	/**
	 * Poster title color (hex), or null. Unused here: the poster's own {@link PublishedCarteText}
	 * labels already carry its title, so the showcase draws no heading of its own over the map.
	 */
	titleColor: string | null;
	bubbles: PublishedCarteBubble[];
	texts: PublishedCarteText[];
}
