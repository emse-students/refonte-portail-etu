import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import db from "$lib/server/database";

export const GET = async (event: RequestEvent) => {
	// Implementation for handling GET requests for images
	const imageId = event.params.id;

	// Get external gallery image from ID

	const externalImage = await db`SELECT * FROM image WHERE id = ${imageId}`;
	if (externalImage.length === 0) {
		return new Response("Image not found", { status: 404 });
	}

	const externalId = externalImage[0].filename;

	// Fetch image from gallery

	const image = await fetch(env.GALLERY_API_URL + "/external/media/" + externalId, {
		headers: {
			"x-api-key": env.GALLERY_API_KEY ?? "",
			Origin: env.PORTAL_URL ?? "",
		},
	});

	if (!image.ok) {
		return new Response("Image not found", { status: 404 });
	}

	const imageBlob = await image.blob();
	const headers = new Headers();
	headers.set("Content-Type", imageBlob.type);

	return new Response(imageBlob, { headers });
};

export const DELETE = async (event: RequestEvent) => {
	// Implementation for handling DELETE requests for images
	const imageId = event.params.id;

	const externalImage = await db`SELECT * FROM image WHERE id = ${imageId}`;
	if (externalImage.length === 0) {
		return new Response("Image not found", { status: 404 });
	}

	const externalId = externalImage[0].filename;

	// Delete image from gallery
	const deleteResponse = await fetch(env.GALLERY_API_URL + "/external/media/" + externalId, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": env.GALLERY_API_KEY ?? "",
			Origin: env.PORTAL_URL ?? "",
		},
	});

	await db`DELETE FROM image WHERE id = ${imageId}`;

	if (!deleteResponse.ok) {
		return new Response("Failed to delete image", { status: 500 });
	}

	return new Response(null, { status: 204 });
};
