import type { RequestEvent } from "./$types";
import { env } from "$env/dynamic/private";
import { getPool } from "$lib/server/database";
import type { ResultSetHeader } from "mysql2";
import {
	checkAssociationPermission,
	checkListPermission,
	checkPermission,
} from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";

export const POST = async (event: RequestEvent) => {
	try {
		console.log("DEBUG: Starting /api/image POST handler");

		// Workaround for potential Bun/SvelteKit streaming issues with formData()
		// We buffer the request body first
		const contentType = event.request.headers.get("content-type") || "";
		const blob = await event.request.blob();

		console.log(`DEBUG: Request body buffered. Size: ${blob.size}, Type: ${contentType}`);

		// Parse FormData from the buffered blob
		const formData = await event.request.formData();

		console.log("DEBUG: FormData parsed successfully");

		const idAsso = formData.get("association_id");
		const idList = formData.get("list_id");

		console.log(`DEBUG: association_id=${idAsso}, list_id=${idList}`);

		// Authorization checks

		let authUser = null;

		if (idAsso) {
			authUser = await checkAssociationPermission(event, Number(idAsso), Permission.ADMIN);
		} else if (idList) {
			authUser = await checkListPermission(event, Number(idList), Permission.ADMIN);
		} else {
			authUser = await checkPermission(event, Permission.ADMIN);
		}

		if (!authUser) {
			return new Response("Unauthorized", { status: 401 });
		}

		const imageFile = formData.get("image");

		if (!(imageFile instanceof File)) {
			console.error("DEBUG: Invalid image file in FormData");
			return new Response("Invalid image file", { status: 400 });
		}

		console.log(
			`Processing upload for file: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`
		);

		console.log("Sending to gallery API at:", env.GALLERY_API_URL);

		// Re-create the file to ensure it's detached from the request stream

		const formDataToSend = new FormData();
		formDataToSend.append("file", imageFile);

		// Upload image to gallery
		const uploadResponse = await fetch(env.GALLERY_API_URL + "/external/media/", {
			method: "POST",
			body: formDataToSend,
			headers: {
				"x-api-key": env.GALLERY_API_KEY,
			},
		});

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text();
			console.error("Gallery API error:", errorText);
			return new Response(
				`Gallery upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
				{ status: 502 }
			);
		}

		console.log("Image uploaded successfully to gallery");
		const result = await uploadResponse.json();

		console.log("Adding image record to database");
		const [insertResult] = await getPool().query<ResultSetHeader>(
			"INSERT INTO image (filename) VALUES (?)",
			[result.assetIds[0]]
		);

		console.log("Image record added with ID:", insertResult.insertId);

		return new Response(JSON.stringify({ id: insertResult.insertId }), { status: 201 });
	} catch (err) {
		console.error("Server error during image upload:", err);
		return new Response("Internal Server Error during upload", { status: 500 });
	}
};
