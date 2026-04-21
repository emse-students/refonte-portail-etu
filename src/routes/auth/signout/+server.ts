import { redirect, type Cookies, type RequestHandler } from "@sveltejs/kit";
import { clearAuthSessionCookie } from "$lib/server/auth";

function logout(cookies: Cookies): never {
	clearAuthSessionCookie(cookies);
	cookies.delete("user_session", { path: "/" });
	throw redirect(303, "/");
}

export const GET: RequestHandler = async ({ cookies }) => logout(cookies);
export const POST: RequestHandler = async ({ cookies }) => logout(cookies);
