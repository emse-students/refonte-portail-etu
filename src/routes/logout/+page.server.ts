import { redirect } from "@sveltejs/kit";
import { clearAuthCookies } from "$lib/jwt";

export async function load({ cookies }) {
    clearAuthCookies(cookies);
    throw redirect(303, "/");
}
