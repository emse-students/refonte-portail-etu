
export const load = async ({ fetch, locals }) => {

	const session = await locals.auth();

	return {
		session
	};
}