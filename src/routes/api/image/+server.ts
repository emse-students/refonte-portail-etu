import type { RequestEvent } from "./$types";
import { env } from "$env/dynamic/private";
import { getPool } from "$lib/server/database";
import type { ResultSetHeader } from "mysql2";

export const POST = async (event: RequestEvent) => {
	try {
		// Implementation for handling POST requests for images
		const formData = await event.request.formData();
		const imageFile = formData.get("image");

		if (!(imageFile instanceof File)) {
			return new Response("Invalid image file", { status: 400 });
		}

		console.log(
			`Processing upload for file: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`
		);

		console.log("Sending to gallery API at:", env.GALLERY_API_URL);

		// Re-create the file to ensure it's detached from the request stream
		const buffer = await imageFile.arrayBuffer();
		const fileToSend = new File([buffer], imageFile.name, { type: imageFile.type });

		const formDataToSend = new FormData();
		formDataToSend.append("file", fileToSend);

		// Upload image to gallery
		const uploadResponse = await fetch(env.GALLERY_API_URL + "/external/media/", {
			method: "POST",
			body: formDataToSend,
			headers: {
				"x-api-key": env.GALLERY_API_KEY,
			},
			//@ts-expect-error Standard fetch does not yet support this option
			duplex: "half",
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
