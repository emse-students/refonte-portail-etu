import { redirect, type RequestHandler } from "@sveltejs/kit";
import {
	buildCallbackUrl,
	generateAuthorizationUrl,
	setOidcTransientCookies,
} from "$lib/server/auth";

export const GET: RequestHandler = async ({ cookies, url }) => {
	const callbackUrl = buildCallbackUrl(url.origin);
	const requestedRedirect = url.searchParams.get("redirectTo") || "/";
	const { state, nonce } = setOidcTransientCookies(cookies, requestedRedirect);
	const authUrl = generateAuthorizationUrl(callbackUrl, state, nonce);
	throw redirect(302, authUrl);
};
