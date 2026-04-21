import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { findUserByAuthIdentifier } from "$lib/server/auth";

export const GET = async (event: RequestEvent) => {
	const identifier = event.params.login;

	// Authentication check

	if (!event.locals.session?.user) {
		return new Response(null, { status: 401 });
	}

	if (!identifier) {
		return new Response(null, { status: 400 });
	}

	const user = await findUserByAuthIdentifier(identifier);
	if (!user) {
		return new Response(null, { status: 404 });
	}

	const galleryIdentifier = user.uid || user.login;

	// Fetch user avatar from gallery, preferring the new authentik uid during transition.

	const avatar = await event
		.fetch(`${env.GALLERY_API_URL}/users/${galleryIdentifier}/avatar`, {
			method: "GET",
			headers: {
				Accept: "image/jpeg",
				"x-api-key": env.GALLERY_API_KEY ?? "",
				Origin: env.PORTAL_URL ?? "",
			},
		})
		.then((res) => {
			if (res.ok) {
				return res.arrayBuffer();
			} else {
				console.error(`Failed to fetch avatar for identifier ${galleryIdentifier}: ${res.status}`);
				return null;
			}
		});

	if (avatar) {
		return new Response(avatar, {
			headers: {
				"Content-Type": "image/jpeg",
			},
		});
	} else {
		return new Response(null, {
			status: 404,
		});
	}
};
