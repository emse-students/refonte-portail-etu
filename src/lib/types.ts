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
