import { redirect } from "@sveltejs/kit";

export const load = async ({ url, locals }) => {
    const ticket = url.searchParams.get('ticket');

    if (ticket) {
        // Validate the ticket with the CAS server
        const user = await validateTicket(ticket);
        if (user) {
            locals.user = user;
            return redirect(302, '/');
        }
    }

    return redirect(302, '/login');
}
const validateTicket = async (ticket: string): Promise<{ id: number; username: string } | null> => {
    // Mock validation logic
    const response = await fetch('https://cas.emse.fr/cas/serviceValidate?service=' + encodeURIComponent('http://localhost:5173/login/callback') + '&ticket=' + encodeURIComponent(ticket));
    if (response.ok) {
        // parse the response to extract user info and create a token using JWT

    }
    return null;
}