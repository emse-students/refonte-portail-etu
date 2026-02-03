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
import logger from "$lib/server/logger";
import { Jimp, JimpMime } from "jimp";

export const POST = async (event: RequestEvent) => {
	try {
		logger.info("DEBUG: Starting /api/image POST handler");

		// Parse FormData from the buffered blob
		const formData = await event.request.formData();

		logger.info("DEBUG: FormData parsed successfully");

		const idAsso = formData.get("association_id");
		const idList = formData.get("list_id");

		logger.info(`DEBUG: association_id=${idAsso}, list_id=${idList}`);

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
			logger.error("DEBUG: Invalid image file in FormData");
			return new Response("Invalid image file", { status: 400 });
		}

		logger.info(
			`Processing upload for file: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`
		);

		// Resize the user-cropped image to standard dimensions and convert to JPEG using Jimp
		const buffer = await imageFile.arrayBuffer();
		const image = await Jimp.read(Buffer.from(buffer));

		image.cover({ w: 800, h: 800 }); // Resize and crop to cover 800x800
		// image.quality(80); // Quality is set during getBuffer for some formats, or separate method depending on version.
		// In Jimp v1, quality might be part of write options or separate.
		// Checking types: cover takes options object.

		const processedBuffer = await image.getBuffer(JimpMime.jpeg, { quality: 80 });

		const newFileName = imageFile.name.replace(/\.[^/.]+$/, "") + ".jpg";
		const processedFile = new File([new Uint8Array(processedBuffer)], newFileName, {
			type: "image/jpeg",
		});

		
		logger.info(`Sending to gallery API at: ${env.GALLERY_API_URL} as ${newFileName}`);

		// Re-create the file to ensure it's detached from the request stream

		const formDataToSend = new FormData();
		formDataToSend.append("file", processedFile);

		// Upload image to gallery
		const uploadResponse = await fetch(env.GALLERY_API_URL + "/external/media/", {
			method: "POST",
			body: formDataToSend,
			headers: {
				"x-api-key": env.GALLERY_API_KEY ?? "",
				Origin: env.PORTAL_URL ?? "",
			},
		});

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text();
			logger.error(`Gallery API error: ${errorText}`);
			return new Response(
				`Gallery upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
				{ status: 502 }
			);
		}

		logger.info("Image uploaded successfully to gallery");
		const result = await uploadResponse.json();

		logger.info("Adding image record to database");
		const [insertResult] = await getPool().query<ResultSetHeader>(
			"INSERT INTO image (filename) VALUES (?)",
			[result.assetIds[0]]
		);

		logger.info(`Image record added with ID: ${insertResult.insertId}`);

		return new Response(JSON.stringify({ id: insertResult.insertId }), { status: 201 });
	} catch (err) {
		logger.error("Server error during image upload:", { error: err });
		return new Response("Internal Server Error during upload", { status: 500 });
	}
};
