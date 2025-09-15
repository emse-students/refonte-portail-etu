import type { RequestEvent } from "@sveltejs/kit";
import jwt from "jsonwebtoken";

export const GET = async (event: RequestEvent) => {
    const { locals } = event;
    if (locals.token || event.request.headers.get("Authorization")) {
        return new Response(JSON.stringify({ error: "Already authenticated" }), { status: 400 });
    }
};