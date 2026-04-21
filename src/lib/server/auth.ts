import { env } from "$env/dynamic/private";
import db from "$lib/server/database";
import type { RawUser } from "$lib/databasetypes";
import type { Cookies, Handle } from "@sveltejs/kit";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export interface OIDCToken {
	access_token: string;
	id_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
}

export interface OIDCProfile {
	sub: string;
	name?: string;
	firstName?: string;
	lastName?: string;
	given_name?: string;
	family_name?: string;
	email?: string;
	promo?: string | number;
	formation?: string;
	[key: string]: unknown;
}

export interface SessionUser {
	id: string;
	name: string;
	email?: string | null;
	first_name?: string | null;
	last_name?: string | null;
	role: string;
	promo?: number | null;
	formation?: string | null;
}

export interface AppSession {
	user: SessionUser;
	expires: string;
}

export function getUserAuthIdentifiers(user: Pick<RawUser, "login" | "uid">): string[] {
	return [user.uid, user.login].filter(
		(value): value is string => typeof value === "string" && value.trim().length > 0
	);
}

export function matchesUserAuthIdentifier(
	identifier: string | null | undefined,
	user: Pick<RawUser, "login" | "uid">
): boolean {
	if (typeof identifier !== "string" || identifier.trim().length === 0) {
		return false;
	}

	return getUserAuthIdentifiers(user).includes(identifier);
}

export async function findUserByAuthIdentifier(identifier: string): Promise<RawUser | null> {
	const normalized = identifier.trim();
	if (!normalized) {
		return null;
	}

	const byUid =
		(await db<RawUser>`SELECT * FROM user WHERE uid = ${normalized}`.then((rows) => rows?.[0])) ||
		null;
	if (byUid) {
		return byUid;
	}

	return (
		(await db<RawUser>`SELECT * FROM user WHERE login = ${normalized}`.then((rows) => rows?.[0])) ||
		null
	);
}

const AUTH_COOKIE_NAME = "auth_session";
const OIDC_STATE_COOKIE_NAME = "oidc_state";
const OIDC_NONCE_COOKIE_NAME = "oidc_nonce";
const OIDC_REDIRECT_COOKIE_NAME = "oidc_redirect_to";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const OIDC_TRANSIENT_COOKIE_MAX_AGE = 60 * 10;

function getTrimmedString(value: unknown): string | null {
	return typeof value === "string" ? value.trim() : null;
}

function getProfileSub(profile: OIDCProfile | Record<string, unknown>): string | null {
	return getTrimmedString(profile.sub);
}

function getProfilePromo(
	profile: OIDCProfile | Record<string, unknown>,
	customClaims: Record<string, unknown>
): unknown {
	return profile.promo ?? customClaims.promo;
}

function getIssuerBaseUrl(): string {
	const raw = (env.MICONNECT_ISSUER || "").trim();
	return raw.replace(/\/+$/, "");
}

function parsePromo(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length > 0) {
		const n = parseInt(value, 10);
		return Number.isNaN(n) ? null : n;
	}
	return null;
}

function decodeJWT(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) {
			return null;
		}

		const decoded = Buffer.from(parts[1], "base64url").toString("utf8");
		const parsed: unknown = JSON.parse(decoded);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: null;
	} catch (e) {
		console.error("[AUTH] Failed to decode JWT:", e);
		return null;
	}
}

async function exchangeCodeForTokens(
	code: string,
	redirectUri: string,
	fetchFn: typeof fetch
): Promise<OIDCToken | null> {
	try {
		const tokenUrl = `${getIssuerBaseUrl()}/token/`;
		const response = await fetchFn(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				client_id: env.MICONNECT_CLIENT_ID as string,
				client_secret: env.MICONNECT_CLIENT_SECRET as string,
				redirect_uri: redirectUri,
			}).toString(),
		});

		if (!response.ok) {
			const errText = await response.text();
			console.error("[AUTH] Token exchange failed:", response.status, errText);
			return null;
		}

		return (await response.json()) as OIDCToken;
	} catch (e) {
		console.error("[AUTH] Token exchange error:", e);
		return null;
	}
}

async function fetchUserProfile(
	accessToken: string,
	fetchFn: typeof fetch
): Promise<OIDCProfile | null> {
	try {
		const userinfoUrl = `${getIssuerBaseUrl()}/userinfo/`;
		const response = await fetchFn(userinfoUrl, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			const errText = await response.text();
			console.error("[AUTH] Userinfo fetch failed:", response.status, errText);
			return null;
		}

		return (await response.json()) as OIDCProfile;
	} catch (e) {
		console.error("[AUTH] Failed to fetch user profile:", e);
		return null;
	}
}

function extractCustomClaims(idToken: string): Record<string, unknown> | null {
	const decoded = decodeJWT(idToken);
	if (!decoded) {
		console.warn("[AUTH] Could not decode ID token");
		return null;
	}

	const standardClaims = [
		"iss",
		"sub",
		"aud",
		"exp",
		"iat",
		"auth_time",
		"acr",
		"nonce",
		"at_hash",
		"name",
		"firstName",
		"lastName",
		"given_name",
		"family_name",
		"email",
		"email_verified",
		"picture",
	];

	const customClaims: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(decoded)) {
		if (!standardClaims.includes(key)) {
			customClaims[key] = value;
		}
	}

	return customClaims;
}

async function handleUserInDatabase(
	profile: OIDCProfile | Record<string, unknown>,
	customClaims: Record<string, unknown>
): Promise<RawUser | null> {
	try {
		const userId = getProfileSub(profile);
		if (!userId) {
			console.error("[AUTH] No sub in profile");
			return null;
		}

		const firstName =
			typeof profile.firstName === "string"
				? profile.firstName.trim()
				: typeof profile.given_name === "string"
					? profile.given_name.trim()
					: "";

		const lastName =
			typeof profile.lastName === "string"
				? profile.lastName.trim()
				: typeof profile.family_name === "string"
					? profile.family_name.trim()
					: "";

		const email =
			typeof profile.email === "string" && profile.email.trim().length > 0
				? profile.email.trim()
				: `${userId}@placeholder.local`;

		const promo = parsePromo(getProfilePromo(profile, customClaims));
		const safeFirstName = firstName || "Unknown";
		const safeLastName = lastName || "User";

		let existingUser = await findUserByAuthIdentifier(userId);

		if (!existingUser && firstName && lastName) {
			existingUser =
				(await db<RawUser>`
					SELECT *
					FROM user
					WHERE LOWER(first_name) = LOWER(${firstName})
					  AND LOWER(last_name) = LOWER(${lastName})
					ORDER BY id ASC
					LIMIT 1
				`.then((rows) => rows?.[0])) || null;
		}

		if (!existingUser) {
			existingUser = await findUserByAuthIdentifier(userId);
		}

		if (!existingUser) {
			await db`
				INSERT INTO user (first_name, last_name, email, login, uid, promo)
				VALUES (${safeFirstName}, ${safeLastName}, ${email}, ${userId}, ${userId}, ${promo})
			`;
		} else {
			await db`
				UPDATE user
				SET first_name = ${safeFirstName},
					last_name = ${safeLastName},
					email = ${email},
					uid = ${userId},
					promo = ${promo},
					edited_at = NOW()
				WHERE id = ${existingUser.id}
			`;
		}

		const user = !existingUser
			? (await db<RawUser>`SELECT * FROM user WHERE login = ${userId}`.then((rows) => rows?.[0])) ||
				null
			: (await db<RawUser>`SELECT * FROM user WHERE id = ${existingUser.id}`.then(
					(rows) => rows?.[0]
				)) || null;
		return user;
	} catch (e) {
		console.error("[AUTH] Error handling user in database:", e);
		return null;
	}
}

export async function completeOIDCFlow(
	code: string,
	redirectUri: string,
	fetchFn: typeof fetch
): Promise<{ tokens: OIDCToken; profile: OIDCProfile; dbUser: RawUser } | null> {
	const tokens = await exchangeCodeForTokens(code, redirectUri, fetchFn);
	if (!tokens) {
		console.error("[AUTH] OIDC flow failed at token exchange");
		return null;
	}

	const customClaims = extractCustomClaims(tokens.id_token) || {};

	const profile = await fetchUserProfile(tokens.access_token, fetchFn);
	if (!profile) {
		console.error("[AUTH] OIDC flow failed at userinfo fetch");
		return null;
	}

	const dbUser = await handleUserInDatabase(profile, customClaims);
	if (!dbUser) {
		console.error("[AUTH] OIDC flow failed at database operation");
		return null;
	}

	return { tokens, profile, dbUser };
}

export function generateAuthorizationUrl(
	redirectUri: string,
	state: string,
	nonce: string
): string {
	const scopes = ["openid", "profile", "email", "promo", "name", "formation"];

	const params = new URLSearchParams({
		response_type: "code",
		client_id: env.MICONNECT_CLIENT_ID as string,
		redirect_uri: redirectUri,
		scope: scopes.join(" "),
		state,
		nonce,
	});

	return `${getIssuerBaseUrl()}/authorize/?${params.toString()}`;
}

export function toSessionUser(dbUser: RawUser): SessionUser {
	return {
		id: dbUser.uid || dbUser.login,
		name: `${dbUser.first_name} ${dbUser.last_name}`.trim(),
		email: dbUser.email,
		first_name: dbUser.first_name,
		last_name: dbUser.last_name,
		role: dbUser.admin ? "admin" : "user",
		promo: dbUser.promo,
		formation: null,
	};
}

function makeSignature(payloadB64: string): string {
	const secret = env.AUTH_SECRET || "default-secret-change-me";
	return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function createSignedValue(data: Record<string, unknown>): string {
	const payloadB64 = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
	return `${payloadB64}.${makeSignature(payloadB64)}`;
}

function parseSignedValue<T extends Record<string, unknown>>(value: string | undefined): T | null {
	if (!value) return null;
	const parts = value.split(".");
	if (parts.length !== 2) return null;

	const [payloadB64, signature] = parts;
	const expected = makeSignature(payloadB64);
	const sigBuf = Buffer.from(signature);
	const expectedBuf = Buffer.from(expected);
	if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
		return null;
	}

	try {
		const payloadRaw = Buffer.from(payloadB64, "base64url").toString("utf8");
		const parsed: unknown = JSON.parse(payloadRaw);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return null;
		}
		return parsed as T;
	} catch {
		return null;
	}
}

function randomToken(size = 24): string {
	return randomBytes(size).toString("base64url");
}

function getSecureCookieFlag(): boolean {
	return env.PROD === "true";
}

function normalizeRedirectTarget(value: string | null | undefined): string {
	if (!value) return "/";
	if (!value.startsWith("/") || value.startsWith("//")) return "/";
	return value;
}

export function buildCallbackUrl(origin: string): string {
	return `${origin}/auth/callback`;
}

export function setOidcTransientCookies(
	cookies: Cookies,
	redirectTo: string
): { state: string; nonce: string } {
	const state = randomToken();
	const nonce = randomToken();
	const secure = getSecureCookieFlag();

	cookies.set(OIDC_STATE_COOKIE_NAME, state, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure,
		maxAge: OIDC_TRANSIENT_COOKIE_MAX_AGE,
	});
	cookies.set(OIDC_NONCE_COOKIE_NAME, nonce, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure,
		maxAge: OIDC_TRANSIENT_COOKIE_MAX_AGE,
	});
	cookies.set(OIDC_REDIRECT_COOKIE_NAME, normalizeRedirectTarget(redirectTo), {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure,
		maxAge: OIDC_TRANSIENT_COOKIE_MAX_AGE,
	});

	return { state, nonce };
}

export function readAndClearOidcTransientCookies(cookies: Cookies): {
	state?: string;
	redirectTo: string;
} {
	const state = cookies.get(OIDC_STATE_COOKIE_NAME);
	const redirectTo = normalizeRedirectTarget(cookies.get(OIDC_REDIRECT_COOKIE_NAME));

	cookies.delete(OIDC_STATE_COOKIE_NAME, { path: "/" });
	cookies.delete(OIDC_NONCE_COOKIE_NAME, { path: "/" });
	cookies.delete(OIDC_REDIRECT_COOKIE_NAME, { path: "/" });

	return { state, redirectTo };
}

export function setAuthSessionCookie(cookies: Cookies, user: SessionUser): void {
	const secure = getSecureCookieFlag();
	const expires = new Date(Date.now() + AUTH_COOKIE_MAX_AGE * 1000).toISOString();
	const value = createSignedValue({ user, expires });

	cookies.set(AUTH_COOKIE_NAME, value, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure,
		maxAge: AUTH_COOKIE_MAX_AGE,
	});
}

export function clearAuthSessionCookie(cookies: Cookies): void {
	cookies.delete(AUTH_COOKIE_NAME, { path: "/" });
}

export function readAuthSessionCookie(cookies: Cookies): AppSession | null {
	const parsed = parseSignedValue<{ user?: SessionUser; expires?: string }>(
		cookies.get(AUTH_COOKIE_NAME)
	);
	if (!parsed?.user || typeof parsed.expires !== "string") {
		return null;
	}

	const expiresMs = Date.parse(parsed.expires);
	if (Number.isNaN(expiresMs) || expiresMs <= Date.now()) {
		return null;
	}

	return {
		user: parsed.user,
		expires: parsed.expires,
	};
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = readAuthSessionCookie(event.cookies) ?? undefined;
	return resolve(event);
};
