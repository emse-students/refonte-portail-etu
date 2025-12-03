import type { RequestEvent } from "./$types";
import { env } from "$env/dynamic/private";
import { getPool } from "$lib/server/database";
import type { ResultSetHeader } from "mysql2";

export const POST = async (event: RequestEvent) => {
	// Implementation for handling POST requests for images
	const formData = await event.request.formData();
	const imageFile = formData.get("image");

	if (!(imageFile instanceof File)) {
		return new Response("Invalid image file", { status: 400 });
	}

	// Upload image to gallery
	const uploadResponse = await fetch(env.GALLERY_API_URL + "external/media/", {
		method: "POST",
		body: formData,
		headers: {
			"x-api-key": env.GALLERY_API_KEY,
		},
	});

	if (!uploadResponse.ok) {
		return new Response("Failed to upload image", { status: 500 });
	}

	const result = await uploadResponse.json();

	const [insertResult] = await getPool().query<ResultSetHeader>(
		"INSERT INTO image (filename) VALUES (?)",
		[result.id]
	);

	return new Response(JSON.stringify({ id: insertResult.insertId }), { status: 201 });
};
