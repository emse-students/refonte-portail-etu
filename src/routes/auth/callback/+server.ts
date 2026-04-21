import { redirect, type RequestHandler } from "@sveltejs/kit";
import {
	buildCallbackUrl,
	completeOIDCFlow,
	readAndClearOidcTransientCookies,
	setAuthSessionCookie,
	toSessionUser,
} from "$lib/server/auth";

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	const code = url.searchParams.get("code");
	const incomingState = url.searchParams.get("state");
	const { state: expectedState, redirectTo } = readAndClearOidcTransientCookies(cookies);

	if (!code || !incomingState || !expectedState || incomingState !== expectedState) {
		throw redirect(303, "/auth/signin?error=state");
	}

	const callbackUrl = buildCallbackUrl(url.origin);
	const result = await completeOIDCFlow(code, callbackUrl, fetch);
	if (!result) {
		throw redirect(303, "/auth/signin?error=oidc");
	}

	setAuthSessionCookie(cookies, toSessionUser(result.dbUser));
	cookies.delete("user_session", { path: "/" });

	throw redirect(303, redirectTo);
};
