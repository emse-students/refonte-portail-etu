import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

export const GET = async (event: RequestEvent) => {
	const login = event.params.login;

	// Authentication check

	if (!event.locals.session?.user) {
		return new Response(null, { status: 401 });
	}

	// Fetch user by login from migallery (with api key if needed)

	const avatar = await event
		.fetch(`${env.GALLERY_API_URL}/users/${login}/avatar`, {
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
				console.error(`Failed to fetch avatar for login ${login}: ${res.status}`);
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
