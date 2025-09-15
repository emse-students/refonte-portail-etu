
export const load = async ({ fetch, locals }) => {
	
    console.log(locals.token)
	return {
        user: locals.user,
	};
}