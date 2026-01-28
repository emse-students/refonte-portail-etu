import type { RequestEvent } from "@sveltejs/kit";
import Permission, { hasPermission } from "$lib/permissions";
import type { FullUser } from "$lib/databasetypes";

export type AuthenticatedUser = FullUser;

/**
 * Vérifie l'authentification et récupère les données utilisateur depuis locals (déjà en cache)
 * @param event RequestEvent de SvelteKit
 * @returns Utilisateur authentifié avec permissions ou null
 */
export async function requireAuth(event: RequestEvent): Promise<AuthenticatedUser | null> {
	// Les données utilisateur sont déjà chargées dans locals par hooks.server.ts
	const userData = event.locals.userData;

	if (!userData) {
		return null;
	}

	return userData as AuthenticatedUser;
}

/**
 * Vérifie qu'un utilisateur a une permission spécifique
 * @param event RequestEvent de SvelteKit
 * @param permission Permission à vérifier
 * @returns Utilisateur si autorisé, null sinon
 */
export async function requirePermission(
	event: RequestEvent,
	permission: Permission
): Promise<AuthenticatedUser | null> {
	const user = await requireAuth(event);
	if (!user) {
		return null;
	}

	if (!hasPermission(user.permissions, permission)) {
		return null;
	}

	return user;
}

/**
 * Répond avec une erreur 401 Unauthorized
 */
export function unauthorizedResponse(): Response {
	return new Response(
		JSON.stringify({ error: "Unauthorized", message: "Vous devez être connecté" }),
		{
			status: 401,
			headers: { "Content-Type": "application/json" },
		}
	);
}

/**
 * Répond avec une erreur 403 Forbidden
 */
export function forbiddenResponse(message?: string): Response {
	return new Response(
		JSON.stringify({
			error: "Forbidden",
			message: message || "Vous n'avez pas la permission d'effectuer cette action",
		}),
		{
			status: 403,
			headers: { "Content-Type": "application/json" },
		}
	);
}

/**
 * Middleware complet : authentification + permission
 * Utilise les données déjà en cache dans event.locals.userData (chargées par hooks.server.ts)
 */
export async function checkPermission(
	event: RequestEvent,
	permission: Permission
): Promise<
	{ authorized: true; user: AuthenticatedUser } | { authorized: false; response: Response }
> {
	const user = await requireAuth(event);

	if (!user) {
		return { authorized: false, response: unauthorizedResponse() };
	}

	if (!hasPermission(user.permissions, permission)) {
		return { authorized: false, response: forbiddenResponse() };
	}

	return { authorized: true, user };
}

/**
 * Vérifie la cohérence entre session Auth.js et userData
 * Retourne true si les données sont cohérentes
 */
export function verifySessionConsistency(event: RequestEvent): boolean {
	const session = event.locals.session;
	const userData = event.locals.userData;

	// Si pas de session, pas de userData attendu
	if (!session) {
		return userData === null;
	}

	// Si session existe, userData doit exister et avoir le même ID
	if (!userData) {
		return false;
	}

	return String(session.user?.id) === String(userData.id);
}

/**
 * Vérifie qu'un utilisateur a une permission spécifique pour une association donnée
 * Les permissions globales (ADMIN, SITE_ADMIN) outrepassent les permissions d'association
 *
 * @param user Utilisateur authentifié avec ses memberships
 * @param associationId ID de l'association concernée
 * @param permission Permission à vérifier
 * @returns true si l'utilisateur a la permission pour cette association
 */
export function hasAssociationPermission(
	user: AuthenticatedUser,
	associationId: number,
	permission: Permission
): boolean {
	// Si l'utilisateur a la permission globalement, il l'a pour toutes les associations
	if (hasPermission(user.permissions, permission)) {
		return true;
	}

	// Vérifier si l'utilisateur a un membership dans cette association avec la permission requise
	if (!user.memberships || user.memberships.length === 0) {
		return false;
	}

	return user.memberships.some(
		(membership) =>
			membership.association_id === associationId &&
			hasPermission(membership.permissions, permission)
	);
}

/**
 * Vérifie qu'un utilisateur a une permission spécifique pour une liste donnée
 *
 * @param user Utilisateur authentifié
 * @param listId ID de la liste
 * @param permission Permission requise
 * @returns true si autorisé
 */
export function hasListPermission(
	user: AuthenticatedUser,
	listId: number,
	permission: Permission
): boolean {
	// Global permission overrides
	if (hasPermission(user.permissions, permission)) {
		return true;
	}

	if (!user.memberships || user.memberships.length === 0) {
		return false;
	}

	return user.memberships.some(
		(membership) =>
			membership.list_id === listId && hasPermission(membership.permissions, permission)
	);
}

/**
 * Middleware pour vérifier l'authentification et les permissions au niveau d'une association
 *
 * @param event RequestEvent
 * @param associationId ID de l'association
 * @param permission Permission requise
 * @returns Résultat de l'autorisation
 */
export async function checkAssociationPermission(
	event: RequestEvent,
	associationId: number,
	permission: Permission
): Promise<
	{ authorized: true; user: AuthenticatedUser } | { authorized: false; response: Response }
> {
	const user = await requireAuth(event);

	if (!user) {
		return { authorized: false, response: unauthorizedResponse() };
	}

	// Vérifier les permissions globales ou d'association
	if (!hasAssociationPermission(user, associationId, permission)) {
		return {
			authorized: false,
			response: forbiddenResponse(
				`Vous n'avez pas la permission nécessaire pour cette association`
			),
		};
	}

	return { authorized: true, user };
}

/**
 * Middleware pour vérifier l'authentification et les permissions au niveau d'une liste
 */
export async function checkListPermission(
	event: RequestEvent,
	listId: number,
	permission: Permission
): Promise<
	{ authorized: true; user: AuthenticatedUser } | { authorized: false; response: Response }
> {
	const user = await requireAuth(event);

	if (!user) {
		return { authorized: false, response: unauthorizedResponse() };
	}

	if (!hasListPermission(user, listId, permission)) {
		return {
			authorized: false,
			response: forbiddenResponse(`Vous n'avez pas la permission nécessaire pour cette liste`),
		};
	}

	return { authorized: true, user };
}

/**
 * Récupère la liste des IDs d'associations pour lesquelles l'utilisateur a une permission donnée
 * Les admins globaux ont accès à toutes les associations
 *
 * @param user Utilisateur authentifié
 * @param permission Permission à vérifier
 * @returns Liste des IDs d'associations autorisées, ou null si admin global (= toutes)
 */
export function getAuthorizedAssociationIds(
	user: AuthenticatedUser,
	permission: Permission
): number[] | null {
	// Si l'utilisateur a la permission globalement, il a accès à toutes les associations
	if (hasPermission(user.permissions, permission)) {
		return null; // null = toutes les associations
	}

	// Filtrer les memberships ayant la permission requise
	if (!user.memberships || user.memberships.length === 0) {
		return [];
	}

	return user.memberships
		.filter((membership) => hasPermission(membership.permissions, permission))
		.map((membership) => membership.association_id)
		.filter((m) => m !== undefined && m !== null) as number[];
}

/**
 * Récupère la liste des IDs de listes pour lesquelles l'utilisateur a une permission donnée
 */
export function getAuthorizedListIds(
	user: AuthenticatedUser,
	permission: Permission
): number[] | null {
	if (hasPermission(user.permissions, permission)) {
		return null;
	}

	if (!user.memberships || user.memberships.length === 0) {
		return [];
	}

	return user.memberships
		.filter((membership) => hasPermission(membership.permissions, permission))
		.map((membership) => membership.list_id)
		.filter((l) => l !== undefined && l !== null) as number[];
}
